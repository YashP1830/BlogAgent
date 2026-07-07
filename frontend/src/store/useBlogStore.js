import { create } from "zustand";
import { streamGenerateBlog } from "../api/blogApi";

const PIPELINE_ORDER = ["router", "research", "orchestrator", "worker", "reducer"];

export const useBlogStore = create((set, get) => ({
  // form fields
  topic: "",
  description: "",
  audience: "",
  tone: "",

  // run status: 'idle' | 'running' | 'done' | 'error'
  status: "idle",
  currentNode: null,
  completedNodes: [],
  log: [], // [{node, label, timestamp, meta}]
  workerCount: 0,
  workersDone: 0,

  plan: null,
  finalMarkdown: "",
  errorMessage: "",

  activeTab: "plan", // 'plan' | 'blog'

  _abort: null,

  setField: (key, value) => set({ [key]: value }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  reset: () => {
    const abort = get()._abort;
    if (abort) abort();
    set({
      status: "idle",
      currentNode: null,
      completedNodes: [],
      log: [],
      workerCount: 0,
      workersDone: 0,
      plan: null,
      finalMarkdown: "",
      errorMessage: "",
      _abort: null,
    });
  },

  generateBlog: () => {
    const { topic, description, audience, tone } = get();
    if (!topic.trim()) {
      set({ status: "error", errorMessage: "Please enter a blog topic first." });
      return;
    }

    // reset previous run state but keep form fields
    set({
      status: "running",
      currentNode: "router",
      completedNodes: [],
      log: [],
      workerCount: 0,
      workersDone: 0,
      plan: null,
      finalMarkdown: "",
      errorMessage: "",
      activeTab: "plan",
    });

    const abort = streamGenerateBlog(
      { topic, description, audience, tone },
      {
        onNodeUpdate: (data) => {
          set((state) => {
            const entry = {
              node: data.node,
              label: data.label,
              timestamp: new Date().toLocaleTimeString(),
              meta: data,
            };

            const updates = {
              currentNode: data.node,
              log: [...state.log, entry],
            };

            if (data.node === "orchestrator" && data.plan) {
              updates.plan = data.plan;
              updates.workerCount = data.plan.tasks?.length || 0;
              updates.completedNodes = Array.from(
                new Set([...state.completedNodes, "router", "research", "orchestrator"])
              );
            }

            if (data.node === "worker") {
              updates.workersDone = state.workersDone + 1;
            }

            if (data.node === "reducer") {
              updates.finalMarkdown = data.final || "";
              updates.completedNodes = Array.from(new Set([...state.completedNodes, ...PIPELINE_ORDER]));
            }

            return updates;
          });
        },
        onDone: () => {
          set((state) => ({
            status: "done",
            currentNode: null,
            activeTab: state.finalMarkdown ? "blog" : "plan",
          }));
        },
        onError: (data) => {
          set({ status: "error", errorMessage: data.message || "Something went wrong." });
        },
      }
    );

    set({ _abort: abort });
  },
}));

export { PIPELINE_ORDER };
