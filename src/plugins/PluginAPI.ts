// Plugin API - プラグインが使用するAPI実装

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { blockService, executeGraphQL } from '../services';
import { LoveNotePluginAPI, MessageType, Block } from './types';

// Error Boundary Component for Plugin Components
function PluginErrorBoundary({
  children,
  pluginId,
  onError,
}: {
  children: React.ReactNode;
  pluginId: string;
  onError: (error: Error) => void;
}) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
      console.error(`Plugin ${pluginId} component error:`, event.error);
      onError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [pluginId, onError]);

  if (hasError) {
    return React.createElement(
      'div',
      {
        className: 'p-4 bg-red-50 border border-red-200 rounded-lg',
      },
      React.createElement(
        'h3',
        { className: 'text-lg font-medium text-red-800 mb-2' },
        `Plugin Error: ${pluginId}`
      ),
      React.createElement(
        'p',
        { className: 'text-red-600 text-sm' },
        error?.message || 'Unknown error occurred'
      ),
      React.createElement(
        'button',
        {
          className:
            'mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700',
          onClick: () => {
            setHasError(false);
            setError(undefined);
          },
        },
        'Retry'
      )
    );
  }

  return children;
}

interface PluginPanel {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  container: HTMLElement;
  root: Root;
}

interface PluginSidebarItem {
  id: string;
  icon: string;
  label: string;
  view: React.ComponentType<any>;
}

export class PluginAPI implements LoveNotePluginAPI {
  private pluginId: string;
  private buttonElements = new Map<string, HTMLElement>();
  private panelElements = new Map<string, PluginPanel>();
  private messageContainer: HTMLElement | null = null;
  private sidebarItems = new Map<string, PluginSidebarItem>();

  constructor(pluginId: string) {
    this.pluginId = pluginId;
    this.initializeMessageContainer();
  }

  /**
   * ツールバーにボタンを追加（レベル1 API）
   */
  addButton(label: string, onClick: () => void): string {
    const buttonId = `plugin-button-${this.pluginId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const button = this.createButton(buttonId, label, onClick);
      this.addButtonToToolbar(button);
      this.buttonElements.set(buttonId, button);

      console.log(
        `Plugin ${this.pluginId}: Added button "${label}" with ID ${buttonId}`
      );
      return buttonId;
    } catch (error) {
      console.error(`Plugin ${this.pluginId}: Failed to add button:`, error);
      throw error;
    }
  }

  /**
   * メッセージを表示（レベル1 API）
   */
  showMessage(text: string, type: MessageType = 'info'): void {
    try {
      const message = this.createMessage(text, type);
      this.displayMessage(message);

      console.log(`Plugin ${this.pluginId}: Showed message:`, text);
    } catch (error) {
      console.error(`Plugin ${this.pluginId}: Failed to show message:`, error);
    }
  }

  /**
   * サイドバーにアイテムを追加（新機能）
   */
  addSidebarItem(
    icon: string,
    label: string,
    view: React.ComponentType<any>
  ): string {
    const itemId = `plugin-sidebar-${this.pluginId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const sidebarItem: PluginSidebarItem = {
        id: itemId,
        icon,
        label,
        view,
      };

      this.sidebarItems.set(itemId, sidebarItem);

      // viewコンポーネントをapiと一緒にラップ
      const WrappedView = (props: any) => {
        return React.createElement(view, { ...props, api: this });
      };

      const wrappedSidebarItem: PluginSidebarItem = {
        id: itemId,
        icon,
        label,
        view: WrappedView,
      };

      // グローバルなプラグインビューマネージャーに登録
      if (window.pluginViewManager) {
        window.pluginViewManager.registerPluginView(
          this.pluginId,
          itemId,
          wrappedSidebarItem
        );
        console.log(
          `Plugin ${this.pluginId}: Added sidebar item "${label}" with ID ${itemId}`
        );
      } else {
        console.error(
          `Plugin ${this.pluginId}: PluginViewManager not available when trying to add sidebar item "${label}"`
        );
        throw new Error(
          'PluginViewManager is not initialized. Please ensure the plugin system is properly initialized.'
        );
      }

      return itemId;
    } catch (error) {
      console.error(
        `Plugin ${this.pluginId}: Failed to add sidebar item:`,
        error
      );
      throw error;
    }
  }

  /**
   * Reactコンポーネントパネルを追加（レベル2 API）
   */
  addPanel(
    title: string,
    component: React.ComponentType<any>,
    props?: any
  ): string {
    const panelId = `plugin-panel-${this.pluginId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const panel = this.createPanel(panelId, title, component, props);
      this.addPanelToDOM(panel);
      this.panelElements.set(panelId, panel);

      console.log(
        `Plugin ${this.pluginId}: Added panel "${title}" with ID ${panelId}`
      );
      return panelId;
    } catch (error) {
      console.error(`Plugin ${this.pluginId}: Failed to add panel:`, error);
      throw error;
    }
  }

  /**
   * ブロック操作API（レベル2 API）
   */
  blocks = {
    /**
     * 指定されたエクスペリメントのブロックを取得
     */
    get: async (experimentId?: string): Promise<Block[]> => {
      try {
        if (!experimentId) {
          throw new Error('Experiment ID is required');
        }

        const serviceBlocks = await blockService.getBlocks(experimentId);
        return serviceBlocks;
      } catch (error) {
        console.error(`Plugin ${this.pluginId}: Failed to get blocks:`, error);
        throw error;
      }
    },

    /**
     * 新しいブロックを作成
     */
    create: async (
      type: string,
      content: any,
      experimentId?: string
    ): Promise<Block> => {
      try {
        if (!experimentId) {
          throw new Error('Experiment ID is required');
        }

        const serviceBlock = await blockService.createBlock({
          type,
          content,
          experimentId,
        });
        return serviceBlock;
      } catch (error) {
        console.error(
          `Plugin ${this.pluginId}: Failed to create block:`,
          error
        );
        throw error;
      }
    },

    /**
     * 既存のブロックを更新
     */
    update: async (id: string, content: any): Promise<Block> => {
      try {
        const serviceBlock = await blockService.updateBlock({
          id,
          content,
        });
        return serviceBlock;
      } catch (error) {
        console.error(
          `Plugin ${this.pluginId}: Failed to update block:`,
          error
        );
        throw error;
      }
    },

    /**
     * ブロックを削除
     */
    delete: async (id: string): Promise<void> => {
      try {
        await blockService.deleteBlock(id);
      } catch (error) {
        console.error(
          `Plugin ${this.pluginId}: Failed to delete block:`,
          error
        );
        throw error;
      }
    },

    /**
     * ブロック変更イベントのリスナー（将来実装予定）
     */
    on: (
      _event: 'change' | 'create' | 'delete' | 'select',
      _callback: (block: Block) => void
    ): (() => void) => {
      console.warn(`Plugin ${this.pluginId}: Block events not yet implemented`);
      // 現在は何もしない関数を返す
      return () => {};
    },
  };

  /**
   * GraphQL直接アクセス（レベル4 API）
   */
  graphql = {
    /**
     * GraphQLクエリを実行
     */
    query: async <T = any>(query: string, variables?: any): Promise<T> => {
      try {
        const result = await executeGraphQL<T>(query, variables);
        console.log(`Plugin ${this.pluginId}: GraphQL response:`, result);
        return result;
      } catch (error) {
        console.error(`Plugin ${this.pluginId}: GraphQL query error:`, error);
        throw error;
      }
    },

    /**
     * GraphQLミューテーションを実行
     */
    mutate: async <T = any>(mutation: string, variables?: any): Promise<T> => {
      return this.graphql.query<T>(mutation, variables);
    },

    /**
     * GraphQLサブスクリプション（将来実装予定）
     */
    subscribe: async <T = any>(
      _subscription: string,
      _variables?: any
    ): Promise<AsyncIterator<T>> => {
      console.warn(
        `Plugin ${this.pluginId}: GraphQL subscriptions not yet implemented`
      );
      throw new Error('GraphQL subscriptions not yet implemented');
    },
  };

  /**
   * ユーティリティ
   */
  utils = {
    generateId: (): string => {
      return `${this.pluginId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    },
  };

  /**
   * プラグインのクリーンアップ
   */
  cleanup(): void {
    console.log(
      `Plugin ${this.pluginId}: Starting cleanup, ${this.buttonElements.size} buttons, ${this.panelElements.size} panels, and ${this.sidebarItems.size} sidebar items to remove`
    );

    // ボタンを削除
    this.buttonElements.forEach((button, buttonId) => {
      if (button.parentNode) {
        button.remove();
        console.log(`Plugin ${this.pluginId}: Removed button ${buttonId}`);
      } else {
        console.warn(
          `Plugin ${this.pluginId}: Button ${buttonId} already removed from DOM`
        );
      }
    });
    this.buttonElements.clear();

    // パネルを削除
    this.panelElements.forEach((panel, panelId) => {
      this.removePanel(panel);
      console.log(`Plugin ${this.pluginId}: Removed panel ${panelId}`);
    });
    this.panelElements.clear();

    // サイドバーアイテムを削除
    this.sidebarItems.forEach((_, itemId) => {
      if (window.pluginViewManager) {
        window.pluginViewManager.unregisterPluginView(this.pluginId, itemId);
      }
      console.log(`Plugin ${this.pluginId}: Removed sidebar item ${itemId}`);
    });
    this.sidebarItems.clear();

    console.log(`Plugin ${this.pluginId}: Cleanup completed`);
  }

  /**
   * ボタン要素を作成
   */
  private createButton(
    buttonId: string,
    label: string,
    onClick: () => void
  ): HTMLElement {
    const button = document.createElement('button');
    button.id = buttonId;
    button.textContent = label;
    button.className =
      'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium';

    button.addEventListener('click', () => {
      try {
        onClick();
      } catch (error) {
        console.error(`Plugin ${this.pluginId}: Button click error:`, error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.showMessage(`Button error: ${errorMessage}`, 'error');
      }
    });

    return button;
  }

  /**
   * ツールバーにボタンを追加
   */
  private addButtonToToolbar(button: HTMLElement): void {
    // ツールバーを探す（存在しない場合は作成）
    let toolbar = document.getElementById('plugin-toolbar');

    if (!toolbar) {
      toolbar = this.createToolbar();
    }

    toolbar.appendChild(button);
  }

  /**
   * ツールバーを作成
   */
  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.id = 'plugin-toolbar';
    toolbar.className =
      'flex items-center space-x-2 p-4 bg-gray-50 border-b border-gray-200';

    // ツールバーのタイトル
    const title = document.createElement('span');
    title.textContent = 'Plugins:';
    title.className = 'text-sm font-medium text-gray-700 mr-2';
    toolbar.appendChild(title);

    // アプリのメイン要素に追加
    const app = document.getElementById('root');
    if (app && app.firstChild) {
      app.insertBefore(toolbar, app.firstChild);
    } else {
      document.body.appendChild(toolbar);
    }

    return toolbar;
  }

  /**
   * メッセージコンテナを初期化
   */
  private initializeMessageContainer(): void {
    this.messageContainer = document.getElementById('plugin-messages');

    if (!this.messageContainer) {
      this.messageContainer = this.createMessageContainer();
    }
  }

  /**
   * メッセージコンテナを作成
   */
  private createMessageContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'plugin-messages';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';

    document.body.appendChild(container);
    return container;
  }

  /**
   * メッセージ要素を作成
   */
  private createMessage(text: string, type: MessageType): HTMLElement {
    const message = document.createElement('div');
    message.className = this.getMessageClasses(type);

    // アイコンを追加
    const icon = this.createMessageIcon(type);
    message.appendChild(icon);

    // テキストを追加
    const textElement = document.createElement('span');
    textElement.textContent = text;
    message.appendChild(textElement);

    // 閉じるボタンを追加
    const closeButton = this.createCloseButton(() => {
      message.remove();
    });
    message.appendChild(closeButton);

    return message;
  }

  /**
   * メッセージのCSSクラスを取得
   */
  private getMessageClasses(type: MessageType): string {
    const baseClasses = 'flex items-center p-4 rounded-lg shadow-lg max-w-sm';

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
    }
  }

  /**
   * メッセージアイコンを作成
   */
  private createMessageIcon(type: MessageType): HTMLElement {
    const icon = document.createElement('span');
    icon.className = 'mr-2 text-lg';

    switch (type) {
      case 'success':
        icon.textContent = '✅';
        break;
      case 'warning':
        icon.textContent = '⚠️';
        break;
      case 'error':
        icon.textContent = '❌';
        break;
      default:
        icon.textContent = 'ℹ️';
    }

    return icon;
  }

  /**
   * 閉じるボタンを作成
   */
  private createCloseButton(onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.className = 'ml-auto text-gray-500 hover:text-gray-700';
    button.innerHTML = '×';
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * メッセージを表示
   */
  private displayMessage(message: HTMLElement): void {
    if (!this.messageContainer) {
      this.initializeMessageContainer();
    }

    this.messageContainer?.appendChild(message);

    // 5秒後に自動削除
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 5000);
  }

  /**
   * Reactコンポーネントパネルを作成
   */
  private createPanel(
    panelId: string,
    title: string,
    component: React.ComponentType<any>,
    props?: any
  ): PluginPanel {
    // パネルコンテナを作成
    const container = document.createElement('div');
    container.id = panelId;
    container.className =
      'plugin-panel bg-white border border-gray-200 rounded-lg shadow-sm mb-4';

    // ヘッダー部分を作成
    const header = document.createElement('div');
    header.className =
      'flex items-center justify-between p-4 border-b border-gray-200';

    const titleElement = document.createElement('h3');
    titleElement.className = 'text-lg font-medium text-gray-900';
    titleElement.textContent = title;
    header.appendChild(titleElement);

    // 閉じるボタンを作成
    const closeButton = document.createElement('button');
    closeButton.className =
      'text-gray-400 hover:text-gray-600 transition-colors';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => {
      const panel = this.panelElements.get(panelId);
      if (panel) {
        this.removePanel(panel);
        this.panelElements.delete(panelId);
      }
    });
    header.appendChild(closeButton);

    // コンテンツ部分を作成
    const content = document.createElement('div');
    content.className = 'p-4';

    container.appendChild(header);
    container.appendChild(content);

    // React rootを作成
    const root = createRoot(content);

    // エラーバウンダリでコンポーネントをラップ
    const WrappedComponent = React.createElement(PluginErrorBoundary, {
      pluginId: this.pluginId,
      onError: (error: Error) => {
        this.showMessage(`Panel error: ${error.message}`, 'error');
      },
      children: React.createElement(component, {
        api: this,
        ...props,
      }),
    });

    // コンポーネントをレンダリング
    root.render(WrappedComponent);

    return {
      id: panelId,
      title,
      component,
      container,
      root,
    };
  }

  /**
   * パネルをDOMに追加
   */
  private addPanelToDOM(panel: PluginPanel): void {
    // パネルコンテナを探す（存在しない場合は作成）
    let panelContainer = document.getElementById('plugin-panels');

    if (!panelContainer) {
      panelContainer = this.createPanelContainer();
    }

    panelContainer.appendChild(panel.container);
  }

  /**
   * パネルコンテナを作成
   */
  private createPanelContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'plugin-panels';
    container.className = 'space-y-4 p-4';

    // アプリのメイン要素に追加
    const app = document.getElementById('root');
    if (app) {
      // ツールバーの後に配置
      const toolbar = document.getElementById('plugin-toolbar');
      if (toolbar && toolbar.nextSibling) {
        app.insertBefore(container, toolbar.nextSibling);
      } else {
        app.appendChild(container);
      }
    } else {
      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * パネルを削除
   */
  private removePanel(panel: PluginPanel): void {
    try {
      // React rootを unmount
      panel.root.unmount();

      // DOM要素を削除
      if (panel.container.parentNode) {
        panel.container.remove();
      }
    } catch (error) {
      console.error(
        `Plugin ${this.pluginId}: Error removing panel ${panel.id}:`,
        error
      );
    }
  }
}
