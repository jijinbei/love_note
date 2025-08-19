import React from 'react';
import { useBlocks } from '../../hooks/useBlocks';
import { Block } from '../../services/types';
import MarkdownPreview from '../Markdown/MarkdownPreview';

type BlockListProps = {
  experimentId: string | null;
  onBlockClick: (block: Block) => void;
};

const BlockList: React.FC<BlockListProps> = ({
  experimentId,
  onBlockClick,
}) => {
  const { blocks, loading, error } = useBlocks(experimentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading blocks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!blocks || blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-6xl mb-4">📝</div>
        <div className="text-lg font-medium mb-2">No blocks yet</div>
        <div className="text-sm">Create your first block to get started</div>
      </div>
    );
  }

  const renderBlockContent = (block: Block) => {
    if (block.type === 'markdown' && block.content?.text) {
      return (
        <MarkdownPreview
          markdown={block.content.text}
          className="text-sm leading-relaxed"
        />
      );
    }

    if (block.content) {
      const contentStr = JSON.stringify(block.content);
      return (
        <div className="text-gray-900 text-sm leading-relaxed">
          {contentStr}
        </div>
      );
    }

    return (
      <div className="text-gray-500 text-sm leading-relaxed italic">
        No content
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Blocks</h2>
        <div className="text-sm text-gray-500">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''} in this
          experiment
        </div>
      </div>

      <div className="space-y-4">
        {blocks.map(block => (
          <div
            key={block.id}
            onClick={() => onBlockClick(block)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors"
          >
            {renderBlockContent(block)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockList;
