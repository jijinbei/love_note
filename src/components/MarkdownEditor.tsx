import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // GitHub Flavored Markdown (GFM) をサポート
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const MarkdownEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(event.target.value);
  };

  return (
    <div style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
      {/* Markdown入力エリア */}
      <textarea
        value={markdown}
        onChange={handleInputChange}
        placeholder="ここにMarkdownを書いてください"
        style={{
          width: "50%",
          height: "400px",
          padding: "1rem",
          fontSize: "16px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          fontFamily: "monospace",
        }}
      />

      {/* Markdownプレビューエリア */}
      <div
        className="markdown-preview"
        style={{
          width: "50%",
          height: "400px",
          padding: "1rem",
          backgroundColor: "#f9f9f9",
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflowY: "auto",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownEditor;
