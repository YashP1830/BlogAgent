import React from "react";
import { useBlogStore } from "../store/useBlogStore";

export default function TopicForm() {
  const { topic, description, audience, tone, status, setField, generateBlog, reset } = useBlogStore();

  const isRunning = status === "running";

  const handleSubmit = (e) => {
    e.preventDefault();
    generateBlog();
  };

  return (
    <form className="topic-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Blog topic</span>
        <input
          type="text"
          placeholder="e.g. Self attention in transformer architecture"
          value={topic}
          onChange={(e) => setField("topic", e.target.value)}
          disabled={isRunning}
        />
      </label>

      <label className="field">
        <span>Details (optional)</span>
        <textarea
          rows={4}
          placeholder="Anything specific you want covered..."
          value={description}
          onChange={(e) => setField("description", e.target.value)}
          disabled={isRunning}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Audience (optional)</span>
          <input
            type="text"
            placeholder="e.g. ML beginners"
            value={audience}
            onChange={(e) => setField("audience", e.target.value)}
            disabled={isRunning}
          />
        </label>

        <label className="field">
          <span>Tone (optional)</span>
          <input
            type="text"
            placeholder="e.g. conversational"
            value={tone}
            onChange={(e) => setField("tone", e.target.value)}
            disabled={isRunning}
          />
        </label>
      </div>

      <div className="actions">
        <button type="submit" disabled={isRunning}>
          {isRunning ? "Generating..." : "Generate Blog"}
        </button>
        <button type="button" className="secondary" onClick={reset} disabled={isRunning}>
          Reset
        </button>
      </div>
    </form>
  );
}
