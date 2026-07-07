from __future__ import annotations

import json
import uuid
from datetime import date
from typing import Any, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from graph import blog_graph, IMAGES_DIR

app = FastAPI(title="Blog Writing Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated images at http://localhost:8000/images/<filename>
app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")


class GenerateBlogRequest(BaseModel):
    topic: str
    description: Optional[str] = None
    audience: Optional[str] = None
    tone: Optional[str] = None


def _build_initial_state(payload: GenerateBlogRequest) -> dict:
    full_topic = payload.topic.strip()
    if payload.description:
        full_topic = f"{full_topic}\n\nAdditional details: {payload.description.strip()}"

    return {
        "topic": full_topic,
        "user_audience": payload.audience or "",
        "user_tone": payload.tone or "",
        "as_of": date.today().isoformat(),
        "sections": [],
    }


def _serialize(value: Any) -> Any:
    """Recursively convert pydantic models / tuples into JSON-safe structures."""
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if isinstance(value, (list, tuple)):
        return [_serialize(v) for v in value]
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    return value


NODE_LABELS = {
    "router": "Deciding whether research is needed",
    "research": "Researching the web for evidence",
    "orchestrator": "Planning blog structure and sections",
    "worker": "Writing a section",
    "reducer": "Merging sections and generating images",
}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/generate-blog")
def generate_blog(payload: GenerateBlogRequest):
    """Non-streaming: runs the full graph and returns plan + final blog markdown."""
    initial_state = _build_initial_state(payload)
    final_state = blog_graph.invoke(initial_state)
    return {
        "plan": _serialize(final_state.get("plan")),
        "final": final_state.get("final") or final_state.get("merged_md"),
    }


@app.post("/api/generate-blog/stream")
async def generate_blog_stream(payload: GenerateBlogRequest):
    """Streams node-by-node progress via Server-Sent Events, mirroring the
    router -> research -> orchestrator -> worker(s) -> reducer pipeline."""

    initial_state = _build_initial_state(payload)
    run_id = str(uuid.uuid4())

    def sse(event: str, data: dict) -> str:
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"

    async def event_generator():
        yield sse("start", {"run_id": run_id})
        try:
            async for update in blog_graph.astream(initial_state, stream_mode="updates"):
                for node_name, node_output in update.items():
                    serialized = _serialize(node_output)

                    event_payload = {
                        "node": node_name,
                        "label": NODE_LABELS.get(node_name, node_name),
                    }

                    if node_name == "orchestrator" and serialized.get("plan"):
                        event_payload["plan"] = serialized["plan"]
                    elif node_name == "worker" and serialized.get("sections"):
                        # sections is a list of [task_id, markdown]
                        task_id, section_md = serialized["sections"][0]
                        event_payload["task_id"] = task_id
                        event_payload["preview"] = section_md[:180]
                    elif node_name == "reducer":
                        event_payload["final"] = serialized.get("final") or serialized.get("merged_md")
                    elif node_name == "research":
                        event_payload["evidence_count"] = len(serialized.get("evidence", []))
                    elif node_name == "router":
                        event_payload["mode"] = serialized.get("mode")
                        event_payload["needs_research"] = serialized.get("needs_research")

                    yield sse("node_update", event_payload)

            yield sse("done", {"run_id": run_id})
        except Exception as e:
            yield sse("error", {"message": str(e)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
