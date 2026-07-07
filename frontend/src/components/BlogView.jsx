import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBlogStore } from "../store/useBlogStore";
import { resolveImageUrl } from "../api/blogApi";

export default function BlogView() {
  const { finalMarkdown, status } = useBlogStore();

  if (!finalMarkdown) {
    return (
      <div className="empty-state">
        {status === "running" ? "The blog is being written..." : "No blog yet. Generate one to see it here."}
      </div>
    );
  }

  return (
    <div className="blog-view">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, ...props }) => <img {...props} src={resolveImageUrl(props.src)} alt={props.alt} />,
        }}
      >
        {finalMarkdown}
      </ReactMarkdown>
    </div>
  );
}
