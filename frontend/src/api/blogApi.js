const API_BASE = "http://localhost:8000";

/**
 * Streams blog generation progress from the backend using Server-Sent Events.
 * We use fetch + ReadableStream instead of the native EventSource API because
 * EventSource only supports GET requests, and we need to POST the topic/description.
 *
 * @param {{topic: string, description?: string, audience?: string, tone?: string}} payload
 * @param {{
 *   onStart?: (data: any) => void,
 *   onNodeUpdate?: (data: any) => void,
 *   onDone?: (data: any) => void,
 *   onError?: (data: any) => void,
 * }} handlers
 * @returns {() => void} an abort function
 */
export function streamGenerateBlog(payload, handlers = {}) {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/generate-blog/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by a blank line
        const messages = buffer.split("\n\n");
        buffer = messages.pop(); // keep the last (possibly incomplete) chunk

        for (const raw of messages) {
          if (!raw.trim()) continue;

          let eventType = "message";
          let dataLine = "";

          for (const line of raw.split("\n")) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLine += line.slice(5).trim();
            }
          }

          let data = {};
          try {
            data = dataLine ? JSON.parse(dataLine) : {};
          } catch {
            data = { raw: dataLine };
          }

          if (eventType === "start" && handlers.onStart) handlers.onStart(data);
          else if (eventType === "node_update" && handlers.onNodeUpdate) handlers.onNodeUpdate(data);
          else if (eventType === "done" && handlers.onDone) handlers.onDone(data);
          else if (eventType === "error" && handlers.onError) handlers.onError(data);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError" && handlers.onError) {
        handlers.onError({ message: err.message });
      }
    }
  })();

  return () => controller.abort();
}

/** Non-streaming fallback: waits for the whole pipeline to finish. */
export async function generateBlog(payload) {
  const response = await fetch(`${API_BASE}/api/generate-blog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.json();
}

export function resolveImageUrl(path) {
  if (!path) return path;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
