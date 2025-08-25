import React, { useState } from 'react';
import { blockService } from '../../services/blockService';
import { Block } from '../../services/types';
import {
  BlockTypeConfig,
  defaultBlockTypes,
  getDefaultContent,
} from './blockTypes';

type EmptyStateProps = {
  experimentId: string | null;
  onBlockCreated: (block: Block) => void;
  blockTypes?: BlockTypeConfig[];
};

const EmptyState: React.FC<EmptyStateProps> = ({
  experimentId,
  onBlockCreated,
  blockTypes = defaultBlockTypes,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showBlockTypes, setShowBlockTypes] = useState(false);

  const createBlock = async (type: string) => {
    if (!experimentId || isCreating) return;

    setIsCreating(true);
    try {
      const content = getDefaultContent(type as any);
      const newBlock = await blockService.createBlock({
        experimentId,
        type,
        content,
      });

      onBlockCreated(newBlock);
      setShowBlockTypes(false);
    } catch (error) {
      console.error('Failed to create block:', error);
      alert('Failed to create block. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <div className="text-lg font-medium mb-2">No blocks yet</div>
      <div className="text-sm mb-6">Create your first block to get started</div>

      <div className="w-full max-w-2xl border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
        {!showBlockTypes ? (
          <div className="text-center">
            <button
              onClick={() => setShowBlockTypes(true)}
              disabled={!experimentId}
              className="w-full py-3 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-lg">+</span> Add Block
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {blockTypes.map(blockType => (
                <button
                  key={blockType.type}
                  onClick={() => createBlock(blockType.type)}
                  disabled={isCreating}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="text-xl mb-1">{blockType.icon}</div>
                  <div className="text-xs font-medium text-gray-900 mb-1">
                    {blockType.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {blockType.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowBlockTypes(false)}
                disabled={isCreating}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isCreating && (
          <div className="text-center text-sm text-blue-600 mt-2">
            Creating block...
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
