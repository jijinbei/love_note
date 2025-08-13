import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import 'katex/dist/katex.min.css';

const INITIAL_SAMPLE = `文章
# aaa

## aaa

### aaa

#### aaa

---
順序なしリスト
- apple
- banana
- grape

番号付きリスト
1. first
2. second
3. third
---

インライン数式

$E = mc^2$

ブロック数式

$$
\\int_0^\\infty x^2 \\, dx
$$

---
コード
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet("World");
\`\`\`
`;

const MarkdownEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>(INITIAL_SAMPLE);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(event.target.value);
  };

  return (
    <>
      {/* 記入例ヘッダー */}
      <div className="flex items-center px-6 py-4 border-b border-gray-100">
        <span className="font-bold text-lg">記入例 (Markdown記法)</span>
        <div className="flex-1" />
      </div>

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
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={match ? match[1] : 'text'}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
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

export default MarkdownEditor;
