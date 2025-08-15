import React from 'react';
import ReactMarkdown from 'react-markdown';
import { markdownPlugins, markdownComponents } from './config';

import 'katex/dist/katex.min.css';

interface PreviewModeProps {
  markdown: string;
}

const PreviewMode: React.FC<PreviewModeProps> = ({ markdown }) => {
  return (
    <div className="flex justify-center p-4">
      <div className="markdown-preview max-w-4xl w-full">
        <ReactMarkdown {...markdownPlugins} components={markdownComponents}>
          {markdown || '**内容を編集モードで入力してください**'}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default PreviewMode;
