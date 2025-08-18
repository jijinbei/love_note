// Plugin Registry - プラグインの登録・管理

import { PluginDescriptor, PluginError } from './types';
import { ESModuleLoader } from './ESModuleLoader';
import { PluginAPI } from './PluginAPI';

export class PluginRegistry {
  private plugins = new Map<string, PluginDescriptor>();
  private pluginAPIs = new Map<string, PluginAPI>();
  private moduleLoader = new ESModuleLoader();
  private errorHandlers: ((error: PluginError) => void)[] = [];

  /**
   * ファイルからプラグインをインストール
   */
  async installFromFile(file: File): Promise<PluginDescriptor> {
    try {
      console.log(`Installing plugin from file: ${file.name}`);

      // ファイルを読み込み
      const descriptor = await this.moduleLoader.loadFromFile(file);

      if (descriptor.status === 'error') {
        throw new Error(descriptor.error || 'Unknown error');
      }

      // プラグインを登録
      await this.registerPlugin(descriptor);

      console.log(`Successfully installed plugin: ${descriptor.name}`);
      return descriptor;
    } catch (error) {
      console.error(`Failed to install plugin from file:`, error);
      throw error;
    }
  }

  /**
   * コードからプラグインをインストール
   */
  async installFromCode(
    code: string,
    name?: string
  ): Promise<PluginDescriptor> {
    try {
      const pluginId = `inline-${Date.now()}`;
      console.log(`Installing plugin from code: ${name || pluginId}`);

      // コードを読み込み
      const descriptor = await this.moduleLoader.loadFromCode(
        code,
        pluginId,
        name
      );

      if (descriptor.status === 'error') {
        throw new Error(descriptor.error || 'Unknown error');
      }

      // プラグインを登録
      await this.registerPlugin(descriptor);

      console.log(`Successfully installed plugin: ${descriptor.name}`);
      return descriptor;
    } catch (error) {
      console.error(`Failed to install plugin from code:`, error);
      throw error;
    }
  }

  /**
   * プラグインを登録
   */
  private async registerPlugin(descriptor: PluginDescriptor): Promise<void> {
    try {
      // 既存のプラグインがある場合はアンロード
      if (this.plugins.has(descriptor.id)) {
        await this.unloadPlugin(descriptor.id);
      }

      // プラグインを登録
      this.plugins.set(descriptor.id, descriptor);

      // プラグインを読み込み
      await this.loadPlugin(descriptor.id);
    } catch (error) {
      descriptor.status = 'error';
      descriptor.error =
        error instanceof Error ? error.message : 'Unknown error';
      this.plugins.set(descriptor.id, descriptor);
      throw error;
    }
  }

  /**
   * プラグインを読み込み
   */
  async loadPlugin(pluginId: string): Promise<void> {
    const descriptor = this.plugins.get(pluginId);
    if (!descriptor) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!descriptor.module) {
      throw new Error(`Plugin ${pluginId} has no module`);
    }

    try {
      console.log(`Loading plugin: ${descriptor.name}`);

      // Plugin APIを作成
      const api = new PluginAPI(pluginId);
      this.pluginAPIs.set(pluginId, api);

      // onLoad を実行
      await descriptor.module.onLoad(api);

      descriptor.status = 'loaded';
      descriptor.loadedAt = new Date();

      console.log(`Successfully loaded plugin: ${descriptor.name}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      descriptor.status = 'error';
      descriptor.error = errorMessage;

      this.handleError({
        pluginId,
        message: errorMessage,
        stack: errorStack,
        context: 'load',
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * プラグインをアンロード
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const descriptor = this.plugins.get(pluginId);
    if (!descriptor) {
      return;
    }

    try {
      console.log(`Unloading plugin: ${descriptor.name}`);

      // onUnload を実行
      if (descriptor.module?.onUnload) {
        await descriptor.module.onUnload();
      }

      // Plugin APIをクリーンアップ
      const api = this.pluginAPIs.get(pluginId);
      if (api) {
        console.log(`Calling cleanup for plugin: ${pluginId}`);
        api.cleanup();
        this.pluginAPIs.delete(pluginId);
      } else {
        console.warn(`No API found for plugin: ${pluginId}`);
      }

      // モジュールローダーからアンロード
      this.moduleLoader.unloadPlugin(pluginId);

      descriptor.status = 'disabled';

      console.log(`Successfully unloaded plugin: ${descriptor.name}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.handleError({
        pluginId,
        message: errorMessage,
        stack: errorStack,
        context: 'unload',
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * プラグインをリロード
   */
  async reloadPlugin(pluginId: string): Promise<void> {
    const descriptor = this.plugins.get(pluginId);
    if (!descriptor) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      console.log(`Reloading plugin: ${descriptor.name}`);

      // 現在の状態を保存
      const previousState = {}; // TODO: 状態保存機能を実装

      // アンロード
      await this.unloadPlugin(pluginId);

      // モジュールをリロード
      const newDescriptor = await this.moduleLoader.reloadPlugin(pluginId);
      newDescriptor.name = descriptor.name; // 名前を保持
      this.plugins.set(pluginId, newDescriptor);

      // 再読み込み
      await this.loadPlugin(pluginId);

      // onReload を実行
      if (newDescriptor.module?.onReload) {
        const newApi = this.pluginAPIs.get(pluginId);
        if (newApi) {
          await newDescriptor.module.onReload(newApi, previousState);
        }
      }

      console.log(`Successfully reloaded plugin: ${descriptor.name}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.handleError({
        pluginId,
        message: errorMessage,
        stack: errorStack,
        context: 'load',
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * プラグインを削除
   */
  async removePlugin(pluginId: string): Promise<void> {
    await this.unloadPlugin(pluginId);
    this.plugins.delete(pluginId);
    console.log(`Removed plugin: ${pluginId}`);
  }

  /**
   * インストール済みプラグイン一覧を取得
   */
  getInstalledPlugins(): PluginDescriptor[] {
    return Array.from(this.plugins.values());
  }

  /**
   * プラグイン情報を取得
   */
  getPlugin(pluginId: string): PluginDescriptor | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * プラグインを検索
   */
  searchPlugins(query: string): PluginDescriptor[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.plugins.values()).filter(
      plugin =>
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.description?.toLowerCase().includes(lowerQuery) ||
        plugin.author?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * エラーハンドラーを追加
   */
  onError(handler: (error: PluginError) => void): void {
    this.errorHandlers.push(handler);
  }

  /**
   * エラーを処理
   */
  private handleError(error: PluginError): void {
    console.error(`Plugin error:`, error);

    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    });
  }

  /**
   * 全プラグインの統計情報を取得
   */
  getStats() {
    const plugins = Array.from(this.plugins.values());
    return {
      total: plugins.length,
      loaded: plugins.filter(p => p.status === 'loaded').length,
      error: plugins.filter(p => p.status === 'error').length,
      disabled: plugins.filter(p => p.status === 'disabled').length,
    };
  }
}
