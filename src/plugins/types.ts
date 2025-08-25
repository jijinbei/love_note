// プラグインシステムの型定義

import React from 'react';
import { Block } from '../services/types';

export interface LoveNotePlugin {
  name?: string;
  version?: string;
  description?: string;
  author?: string;

  onLoad(api: LoveNotePluginAPI): void | Promise<void>;
  onUnload?(): void | Promise<void>;
  onReload?(api: LoveNotePluginAPI, previousState?: any): void | Promise<void>;
}

export interface PluginDescriptor {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  source: 'file' | 'directory' | 'url' | 'github';
  path: string;
  sourceCode?: string;
  dbId?: string;
  module?: LoveNotePlugin;
  status: 'loaded' | 'error' | 'disabled';
  error?: string;
  loadedAt?: Date;
}

export interface LoveNotePluginAPI {
  // レベル1: 基本API
  addButton(label: string, onClick: () => void): string;
  showMessage(text: string, type?: MessageType): void;

  // レベル2: React コンポーネント統合
  addPanel(
    title: string,
    component: React.ComponentType<any>,
    props?: any
  ): string;
  addSidebarItem(
    icon: string,
    label: string,
    view: React.ComponentType<any>
  ): string;

  // レベル2: ブロック操作
  blocks: {
    get(experimentId?: string): Promise<Block[]>;
    create(type: string, content: any, experimentId?: string): Promise<Block>;
    update(id: string, content: any): Promise<Block>;
    delete(id: string): Promise<void>;
    on(event: BlockEvent, callback: (block: Block) => void): () => void;
  };

  // レベル3: 高度なUI（後で実装）
  ui?: {
    addToolbarButton(config: ButtonConfig): string;
    addSidePanel(config: PanelConfig): string;
    addBlockType(config: BlockTypeConfig): string;
    removeElement(id: string): void;
  };

  // レベル4: GraphQL直接アクセス
  graphql: {
    query<T>(query: string, variables?: any): Promise<T>;
    mutate<T>(mutation: string, variables?: any): Promise<T>;
    subscribe<T>(
      subscription: string,
      variables?: any
    ): Promise<AsyncIterator<T>>;
  };

  // ユーティリティ
  utils: {
    generateId(): string;
  };
}

export type MessageType = 'info' | 'success' | 'warning' | 'error';
export type BlockEvent = 'change' | 'create' | 'delete' | 'select';

// Block型を再エクスポート
export type { Block };

export interface ButtonConfig {
  label: string;
  icon?: string;
  onClick: () => void;
}

export interface PanelConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  icon?: string;
}

export interface BlockTypeConfig {
  type: string;
  name: string;
  icon?: string;
  editor: React.ComponentType<any>;
  renderer: React.ComponentType<any>;
  defaultContent?: any;
}

export interface PluginError {
  pluginId: string;
  message: string;
  stack?: string;
  context: 'load' | 'runtime' | 'unload';
  timestamp: Date;
}
