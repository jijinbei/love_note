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
    <div className="flex gap-4 p-4">
      {/* Markdown入力エリア */}
      <textarea
        value={markdown}
        onChange={handleInputChange}
        placeholder="ここにMarkdownを書いてください"
        className="w-1/2 h-[400px] p-4 text-base border border-gray-300 rounded-lg font-mono"
      />

      {/* Markdownプレビューエリア */}
      <div className="markdown-preview w-1/2 h-[400px] p-4 bg-gray-100 border border-gray-300">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline ? (
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={match ? match[1] : "text"}
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
