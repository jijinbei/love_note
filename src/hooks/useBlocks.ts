// ブロック操作用のReactカスタムフック

import { useState, useEffect } from 'react';
import { blockService } from '../services';
import { Block } from '../services/types';

/**
 * 指定されたエクスペリメントのブロック操作を行うカスタムフック
 */
export function useBlocks(experimentId: string | null) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ブロックを読み込み
  const loadBlocks = async () => {
    if (!experimentId) return;

    setLoading(true);
    setError(null);
    try {
      const loadedBlocks = await blockService.getBlocks(experimentId);
      setBlocks(loadedBlocks);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load blocks';
      setError(errorMessage);
      console.error('Failed to load blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  // ブロックを作成
  const createBlock = async (
    type: string,
    content: any
  ): Promise<Block | null> => {
    if (!experimentId) return null;

    setError(null);
    try {
      const newBlock = await blockService.createBlock({
        type,
        content,
        experimentId,
      });
      setBlocks(prev => [...prev, newBlock]);
      return newBlock;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create block';
      setError(errorMessage);
      console.error('Failed to create block:', err);
      return null;
    }
  };

  // ブロックを更新
  const updateBlock = async (
    id: string,
    content: any
  ): Promise<Block | null> => {
    setError(null);
    try {
      const updatedBlock = await blockService.updateBlock({ id, content });
      setBlocks(prev =>
        prev.map(block => (block.id === id ? updatedBlock : block))
      );
      return updatedBlock;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update block';
      setError(errorMessage);
      console.error('Failed to update block:', err);
      return null;
    }
  };

  // ブロックを削除
  const deleteBlock = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await blockService.deleteBlock(id);
      setBlocks(prev => prev.filter(block => block.id !== id));
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete block';
      setError(errorMessage);
      console.error('Failed to delete block:', err);
      return false;
    }
  };

  // エクスペリメントIDが変更されたときにブロックを再読み込み
  useEffect(() => {
    loadBlocks();
  }, [experimentId]);

  return {
    blocks,
    loading,
    error,
    loadBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
  };
}
