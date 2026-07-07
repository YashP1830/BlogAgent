import React from "react";
import { useBlogStore } from "../store/useBlogStore";

export default function PlanView() {
  const { plan, status } = useBlogStore();

  if (!plan) {
    return (
      <div className="empty-state">
        {status === "running" ? "Waiting for the plan..." : "No plan yet. Generate a blog to see it here."}
      </div>
    );
  }

  return (
    <div className="plan-view">
      <h2>{plan.blog_title}</h2>
      <div className="plan-meta">
        <span className="chip">Audience: {plan.audience}</span>
        <span className="chip">Tone: {plan.tone}</span>
        <span className="chip">Kind: {plan.blog_kind}</span>
      </div>

      {plan.constraints?.length > 0 && (
        <div className="constraints">
          <strong>Constraints:</strong>
          <ul>
            {plan.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="task-list">
        {plan.tasks?.map((task) => (
          <div className="task-card" key={task.id}>
            <div className="task-header">
              <span className="task-index">#{task.id}</span>
              <h4>{task.title}</h4>
              <span className="task-words">{task.target_words} words</span>
            </div>
            <p className="task-goal">{task.goal}</p>
            <ul className="task-bullets">
              {task.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <div className="task-tags">
              {task.tags?.map((t, i) => (
                <span key={i} className="tag">
                  {t}
                </span>
              ))}
              {task.requires_research && <span className="flag flag-research">research</span>}
              {task.requires_citations && <span className="flag flag-citations">citations</span>}
              {task.requires_code && <span className="flag flag-code">code</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
