import React from "react";
import { useBlogStore } from "../store/useBlogStore";

const STAGES = [
  { key: "router", label: "Router" },
  { key: "research", label: "Research" },
  { key: "orchestrator", label: "Orchestrator (Plan)" },
  { key: "worker", label: "Workers (Writing)" },
  { key: "reducer", label: "Reducer (Merge + Images)" },
];

export default function ProgressTracker() {
  const { status, currentNode, completedNodes, workerCount, workersDone, errorMessage, log } = useBlogStore();

  if (status === "idle") return null;

  return (
    <div className="progress-tracker">
      <h3>Agent Progress</h3>

      <ol className="stage-list">
        {STAGES.map((stage) => {
          const isDone = completedNodes.includes(stage.key);
          const isActive = currentNode === stage.key && !isDone;
          return (
            <li
              key={stage.key}
              className={`stage ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
            >
              <span className="dot" />
              <span className="stage-label">{stage.label}</span>
              {stage.key === "worker" && workerCount > 0 && (
                <span className="worker-count">
                  {Math.min(workersDone, workerCount)}/{workerCount} sections
                </span>
              )}
              {isActive && <span className="spinner" />}
            </li>
          );
        })}
      </ol>

      {status === "error" && <p className="error-text">⚠ {errorMessage}</p>}

      {log.length > 0 && (
        <details className="log-details">
          <summary>Execution log</summary>
          <ul>
            {log.map((entry, i) => (
              <li key={i}>
                <span className="log-time">{entry.timestamp}</span> — {entry.label}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
