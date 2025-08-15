import React from 'react';
import ReactMarkdown from 'react-markdown';
import { markdownPlugins, markdownComponents } from './config';

import 'katex/dist/katex.min.css';

interface EditModeProps {
  markdown: string;
  onChange: (value: string) => void;
}

const EditMode: React.FC<EditModeProps> = ({ markdown, onChange }) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
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
          className="flex-1 h-[600px] p-4 text-base border border-gray-300 rounded-lg font-mono outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Markdown 記入欄"
        />
      </div>

      {/* 右：表示欄 */}
      <div className="w-1/2 flex flex-col">
        <div className="text-center font-medium text-sm text-gray-600 mb-2">
          プレビュー
        </div>
        <div className="markdown-preview flex-1 h-[600px] p-4 bg-gray-50 border border-gray-300 rounded-lg overflow-y-auto">
          <ReactMarkdown {...markdownPlugins} components={markdownComponents}>
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default EditMode;
