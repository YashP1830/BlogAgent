import React from "react";
import TopicForm from "./components/TopicForm";
import ProgressTracker from "./components/ProgressTracker";
import PlanView from "./components/PlanView";
import BlogView from "./components/BlogView";
import { useBlogStore } from "./store/useBlogStore";

export default function App() {
  const { activeTab, setActiveTab, plan, finalMarkdown } = useBlogStore();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>🧠 AI Blog Writing Agent</h1>
        <p>Planning agent · Router → Research → Orchestrator → Workers → Reducer</p>
      </header>

      <main className="app-main">
        <aside className="left-panel">
          <TopicForm />
          <ProgressTracker />
        </aside>

        <section className="right-panel">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "plan" ? "active" : ""}`}
              onClick={() => setActiveTab("plan")}
            >
              Plan {plan ? "✓" : ""}
            </button>
            <button
              className={`tab ${activeTab === "blog" ? "active" : ""}`}
              onClick={() => setActiveTab("blog")}
            >
              Blog {finalMarkdown ? "✓" : ""}
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "plan" ? <PlanView /> : <BlogView />}
          </div>
        </section>
      </main>
    </div>
  );
}
