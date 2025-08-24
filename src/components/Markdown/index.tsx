import React, { useState } from 'react';
import { useBlocks } from '../../hooks/useBlocks';
import { Block } from '../../services/types';
import EditMode from './EditMode';
import PreviewMode from './PreviewMode';
import './styles.css';

type MarkdownPageProps = {
  experimentId: string | null;
  selectedBlock?: Block | null;
  onBack?: () => void;
};

const MarkdownPage: React.FC<MarkdownPageProps> = ({
  experimentId,
  selectedBlock,
  onBack,
}) => {
  const [markdown, setMarkdown] = useState<string>('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  // ブロック操作フックを使用
  const { blocks, loading, error, createBlock, updateBlock } =
    useBlocks(experimentId);

  // 選択されたブロック または 既存のMarkdownブロックを読み込み
  React.useEffect(() => {
    if (
      selectedBlock &&
      selectedBlock.type === 'markdown' &&
      selectedBlock.content?.text
    ) {
      // 特定のブロックが選択されている場合はそれを使用
      setMarkdown(selectedBlock.content.text);
    } else if (blocks.length > 0 && !loading) {
      // 選択されたブロックがない場合は最初のMarkdownブロックを使用
      const markdownBlock = blocks.find(block => block.type === 'markdown');
      if (markdownBlock && markdownBlock.content?.text) {
        setMarkdown(markdownBlock.content.text);
      }
    }
  }, [selectedBlock, blocks, loading]);

  const handleMarkdownChange = (value: string) => {
    setMarkdown(value);
  };

  // Markdownをブロックとして保存
  const saveAsBlock = async () => {
    if (!markdown.trim() || !experimentId) return;

    // 選択されたブロックがある場合はそれを更新、なければ最初のmarkdownブロックを探す
    const targetBlock =
      selectedBlock || blocks.find(block => block.type === 'markdown');

    if (targetBlock) {
      // 既存のmarkdownブロックを更新
      const updatedBlock = await updateBlock(targetBlock.id, {
        text: markdown,
      });
      if (updatedBlock) {
        console.log('Markdown updated in block:', updatedBlock.id);
      }
    } else {
      // markdownブロックが存在しない場合は新規作成
      const newBlock = await createBlock('markdown', { text: markdown });
      if (newBlock) {
        console.log('Markdown saved as new block:', newBlock.id);
      }
    }
  };

  return (
    <>
      {/* ヘッダー: モード切り替えボタン */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="ブロック一覧に戻る"
            >
              ← Back
            </button>
          )}
          <h2 className="font-bold text-lg">Markdown エディタ</h2>
          {error && <div className="text-sm text-red-500">Error: {error}</div>}
        </div>

        <div className="flex items-center space-x-2">
          {/* 保存ボタン */}
          <button
            onClick={saveAsBlock}
            disabled={!markdown.trim() || !experimentId}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Markdownをブロックとして保存"
          >
            💾 Save as Block
          </button>

          {/* モード切り替え */}
          <div className="flex bg-gray-200 rounded-lg p-1">
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
