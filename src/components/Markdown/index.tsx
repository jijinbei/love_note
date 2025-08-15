import React, { useState } from 'react';
import EditMode from './EditMode';
import PreviewMode from './PreviewMode';
import './styles.css';

type MarkdownPageProps = {
  experimentId: string | null;
};

const MarkdownPage: React.FC<MarkdownPageProps> = ({ experimentId }) => {
  const [markdown, setMarkdown] = useState<string>('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const handleMarkdownChange = (value: string) => {
    setMarkdown(value);
  };

  return (
    <>
      {/* ヘッダー: モード切り替えボタン */}
      <div className="flex items-center justify-center relative px-6 py-4 border-b border-gray-100">
        <h2 className="font-bold text-lg">Markdown エディタ</h2>
        <div className="absolute right-6 flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => setMode('edit')}
            className={`p-2 rounded-md text-lg transition-colors ${
              mode === 'edit'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="編集モード"
          >
            📝
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`p-2 rounded-md text-lg transition-colors ${
              mode === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="プレビューモード"
          >
            👁️
          </button>
        </div>
      </div>

      {/* 本体 */}
      {mode === 'edit' ? (
        <EditMode markdown={markdown} onChange={handleMarkdownChange} />
      ) : (
        <PreviewMode markdown={markdown} />
      )}
    </>
  );
};

export default MarkdownPage;
