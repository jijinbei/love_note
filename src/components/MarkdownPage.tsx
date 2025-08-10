import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import "katex/dist/katex.min.css";

type MarkdownPageProps = {
    experimentId: string | null;
  };  

const MarkdownPage: React.FC<MarkdownPageProps> = ({ experimentId }) => {
  const [markdown, setMarkdown] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(event.target.value);
  };

  return (
    <>
      {/* 本体 */}
      <div className="flex gap-4 p-4">
        {/* 左：記入欄 */}
        <div className="w-1/2 flex flex-col">
          <div className="text-center font-medium text-sm text-gray-600 mb-2">
            記入欄
          </div>
          <textarea
            value={markdown}
            onChange={handleInputChange}
            placeholder="ここにMarkdownを書いてください"
            className="flex-1 h-[400px] p-4 text-base border border-gray-300 rounded-lg font-mono outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Markdown 記入欄"
          />
        </div>

        {/* 右：表示欄 */}
        <div className="w-1/2 flex flex-col">
          <div className="text-center font-medium text-sm text-gray-600 mb-2">
            表示欄
          </div>
          <div className="markdown-preview flex-1 h-[400px] p-4 bg-gray-50 border border-gray-300 rounded-lg overflow-y-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ inline, className, children, ...props }: any) {
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
      </div>
    </>
  );
};

export default MarkdownPage;
