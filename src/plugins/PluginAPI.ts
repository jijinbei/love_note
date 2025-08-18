// Plugin API - プラグインが使用するAPI実装

import { LoveNotePluginAPI, MessageType } from './types';

export class PluginAPI implements LoveNotePluginAPI {
  private pluginId: string;
  private buttonElements = new Map<string, HTMLElement>();
  private messageContainer: HTMLElement | null = null;

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
      `Plugin ${this.pluginId}: Starting cleanup, ${this.buttonElements.size} buttons to remove`
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
}
