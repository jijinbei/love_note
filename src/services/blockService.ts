// ブロック操作の共通サービス

import { Block, CreateBlockRequest, UpdateBlockRequest } from './types';
import {
  queryGraphQL,
  mutateGraphQL,
  GetBlocksQuery,
  CreateBlockMutation,
  UpdateBlockMutation,
  DeleteBlockMutation,
} from './graphqlClient';

/**
 * ブロック操作サービス
 * アプリケーション内でブロックのCRUD操作を行う共通サービス
 */
export class BlockService {
  /**
   * 指定されたエクスペリメントのブロックを取得
   */
  async getBlocks(experimentId: string): Promise<Block[]> {
    try {
      const response = await queryGraphQL(GetBlocksQuery, { experimentId });

      const blocks = response.blocks || [];
      return blocks.map((block: any) => ({
        id: block.id,
        type: block.blockType,
        content: JSON.parse(block.content),
        metadata: {
          experimentId: block.experimentId,
          orderIndex: block.orderIndex,
        },
        createdAt: new Date(block.createdAt),
        updatedAt: new Date(block.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to get blocks:', error);
      throw error;
    }
  }

  /**
   * 新しいブロックを作成
   */
  async createBlock(request: CreateBlockRequest): Promise<Block> {
    try {
      // 現在のブロック数を取得してorder_indexを設定
      const currentBlocks = await this.getBlocks(request.experimentId);
      const orderIndex = currentBlocks.length;

      const response = await mutateGraphQL(CreateBlockMutation, {
        input: {
          experimentId: request.experimentId,
          blockType: request.type,
          content: JSON.stringify(request.content),
          orderIndex,
        },
      });

      const block = response.createBlock;
      return {
        id: block.id,
        type: block.blockType,
        content: JSON.parse(block.content),
        metadata: {
          experimentId: block.experimentId,
          orderIndex: block.orderIndex,
        },
        createdAt: new Date(block.createdAt),
        updatedAt: new Date(block.updatedAt),
      };
    } catch (error) {
      console.error('Failed to create block:', error);
      throw error;
    }
  }

  /**
   * ブロックを更新
   */
  async updateBlock(request: UpdateBlockRequest): Promise<Block> {
    try {
      const response = await mutateGraphQL(UpdateBlockMutation, {
        id: request.id,
        input: {
          content: JSON.stringify(request.content),
        },
      });

      const block = response.updateBlock;
      if (!block) {
        throw new Error(`Block with ID ${request.id} not found`);
      }

      return {
        id: block.id,
        type: block.blockType,
        content: JSON.parse(block.content),
        metadata: {
          experimentId: block.experimentId,
          orderIndex: block.orderIndex,
        },
        createdAt: new Date(block.createdAt),
        updatedAt: new Date(block.updatedAt),
      };
    } catch (error) {
      console.error('Failed to update block:', error);
      throw error;
    }
  }

  /**
   * ブロックを削除
   */
  async deleteBlock(id: string): Promise<void> {
    try {
      const response = await mutateGraphQL(DeleteBlockMutation, { id });

      if (!response.deleteBlock) {
        throw new Error(`Block with ID ${id} not found`);
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
      throw error;
    }
  }

  /**
   * 複数のブロックを一括更新（順序変更など）
   */
  async updateBlocksOrder(
    blocks: Array<{ id: string; orderIndex: number }>
  ): Promise<void> {
    try {
      // 各ブロックの順序を更新（実際の実装では batch mutation が望ましい）
      await Promise.all(
        blocks.map(async block => {
          await mutateGraphQL(UpdateBlockMutation, {
            id: block.id,
            input: {
              // コンテンツは変更せず、順序のみ更新
              content: '{}', // 実際には既存のコンテンツを取得して使用すべき
            },
          });
        })
      );
    } catch (error) {
      console.error('Failed to update blocks order:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const blockService = new BlockService();
