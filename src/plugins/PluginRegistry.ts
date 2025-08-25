// Plugin Registry - プラグインの登録・管理

import { PluginDescriptor, PluginError } from './types';
import { createESModuleLoader } from './ESModuleLoader';
import { PluginAPI } from './PluginAPI';
import {
  getInstalledPlugins,
  installPlugin,
  uninstallPlugin,
  enablePlugin,
  disablePlugin,
} from '../services/pluginService';

export class PluginRegistry {
  private plugins = new Map<string, PluginDescriptor>();
  private pluginAPIs = new Map<string, PluginAPI>();
  private moduleLoader = createESModuleLoader();
  private errorHandlers: ((error: PluginError) => void)[] = [];
  private initialized = false;

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

      // DBにプラグインを保存
      if (descriptor.module && descriptor.sourceCode) {
        try {
          const dbPlugin = await installPlugin({
            name: descriptor.name,
            version: descriptor.version || '1.0.0',
            description: descriptor.description,
            author: descriptor.author,
            sourceCode: descriptor.sourceCode,
          });

          descriptor.dbId = dbPlugin.id;
          console.log(`Plugin saved to database: ${dbPlugin.id}`);
        } catch (error) {
          console.warn(`Failed to save plugin to database:`, error);
        }
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

      // デバッグ: APIメソッドの存在を確認
      console.log(`Plugin ${pluginId}: API methods available:`, {
        addButton: typeof api.addButton,
        addSidebarItem: typeof api.addSidebarItem,
        showMessage: typeof api.showMessage,
        addPanel: typeof api.addPanel,
      });

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
    const descriptor = this.plugins.get(pluginId);

    // DBからプラグインを削除
    if (descriptor?.dbId) {
      try {
        await uninstallPlugin(descriptor.dbId);
        console.log(`Plugin removed from database: ${descriptor.dbId}`);
      } catch (error) {
        console.warn(`Failed to remove plugin from database:`, error);
      }
    }

    await this.unloadPlugin(pluginId);
    this.plugins.delete(pluginId);
    console.log(`Removed plugin: ${pluginId}`);
  }

  /**
   * プラグインを有効化
   */
  async enablePluginById(pluginId: string): Promise<void> {
    const descriptor = this.plugins.get(pluginId);
    if (!descriptor) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // DBで有効化
      if (descriptor.dbId) {
        await enablePlugin(descriptor.dbId);
        console.log(`Plugin enabled in database: ${descriptor.dbId}`);
      }

      // プラグインを読み込み
      if (descriptor.module) {
        await this.loadPlugin(pluginId);
      } else {
        // モジュールがない場合は状態だけ更新
        descriptor.status = 'loaded';
        this.plugins.set(pluginId, descriptor);
      }
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * プラグインを無効化
   */
  async disablePluginById(pluginId: string): Promise<void> {
    const descriptor = this.plugins.get(pluginId);
    if (!descriptor) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // DBで無効化
      if (descriptor.dbId) {
        await disablePlugin(descriptor.dbId);
        console.log(`Plugin disabled in database: ${descriptor.dbId}`);
      }

      // プラグインをアンロード
      await this.unloadPlugin(pluginId);

      // 状態を明示的に無効化に更新
      descriptor.status = 'disabled';
      this.plugins.set(pluginId, descriptor);
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
      throw error;
    }
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

  /**
   * データベースから既存プラグインを復元
   */
  async initializeFromDatabase(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Loading plugins from database...');
      const dbPlugins = await getInstalledPlugins();

      for (const dbPlugin of dbPlugins) {
        if (dbPlugin.isEnabled) {
          try {
            console.log(`Loading plugin from DB: ${dbPlugin.name}`);

            // DescriptorをDBプラグインから作成
            const descriptor: PluginDescriptor = {
              id: dbPlugin.id,
              name: dbPlugin.name,
              version: dbPlugin.version,
              description: dbPlugin.description,
              author: dbPlugin.author,
              source: 'url' as const,
              path: `db://${dbPlugin.id}`,
              sourceCode: dbPlugin.sourceCode,
              dbId: dbPlugin.id,
              status: 'disabled',
            };

            // ソースコードからモジュールを読み込み
            const moduleDescriptor = await this.moduleLoader.loadFromCode(
              dbPlugin.sourceCode,
              dbPlugin.id,
              dbPlugin.name
            );

            if (moduleDescriptor.status === 'loaded') {
              descriptor.module = moduleDescriptor.module;
              descriptor.status = 'loaded';

              this.plugins.set(dbPlugin.id, descriptor);
              await this.loadPlugin(dbPlugin.id);

              console.log(
                `Successfully loaded plugin from DB: ${dbPlugin.name}`
              );
            } else {
              descriptor.status = 'error';
              descriptor.error =
                moduleDescriptor.error || 'Failed to load module';
              this.plugins.set(dbPlugin.id, descriptor);
              console.error(
                `Failed to load plugin module: ${dbPlugin.name}`,
                moduleDescriptor.error
              );
            }
          } catch (error) {
            console.error(`Error loading plugin ${dbPlugin.name}:`, error);
            // エラーがあってもプラグインリストに追加（無効状態で）
            const errorDescriptor: PluginDescriptor = {
              id: dbPlugin.id,
              name: dbPlugin.name,
              version: dbPlugin.version,
              description: dbPlugin.description,
              author: dbPlugin.author,
              source: 'url' as const,
              path: `db://${dbPlugin.id}`,
              sourceCode: dbPlugin.sourceCode,
              dbId: dbPlugin.id,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            this.plugins.set(dbPlugin.id, errorDescriptor);
          }
        } else {
          // 無効なプラグインもリストに追加（無効状態で）
          const descriptor: PluginDescriptor = {
            id: dbPlugin.id,
            name: dbPlugin.name,
            version: dbPlugin.version,
            description: dbPlugin.description,
            author: dbPlugin.author,
            source: 'url' as const,
            path: `db://${dbPlugin.id}`,
            sourceCode: dbPlugin.sourceCode,
            dbId: dbPlugin.id,
            status: 'disabled',
          };
          this.plugins.set(dbPlugin.id, descriptor);
          console.log(`Plugin ${dbPlugin.name} is disabled, added to registry`);
        }
      }

      this.initialized = true;
      console.log(`Loaded ${dbPlugins.length} plugins from database`);
    } catch (error) {
      console.error('Failed to load plugins from database:', error);
      this.initialized = true; // エラーがあっても初期化完了とする
    }
  }
}
