import React from 'react';
import ReactMarkdown from 'react-markdown';
import { markdownPlugins, markdownComponents } from './config';

import 'katex/dist/katex.min.css';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  markdown, 
  className = ''
}) => {
  return (
    <div className={`markdown-preview-compact ${className}`}>
      <ReactMarkdown {...markdownPlugins} components={markdownComponents}>
        {markdown || '*No content*'}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;