// Plugin System Entry Point

export { PluginRegistry } from './PluginRegistry';
export { createESModuleLoader } from './ESModuleLoader';
export { PluginAPI } from './PluginAPI';
export {
  PluginViewManager,
  createGlobalPluginViewManager,
} from './PluginViewManager';
export * from './types';

// プラグインシステムのシングルトンインスタンス
import { PluginRegistry } from './PluginRegistry';
import { createGlobalPluginViewManager } from './PluginViewManager';

let pluginRegistryInstance: PluginRegistry | null = null;

/**
 * プラグインレジストリのシングルトンインスタンスを取得
 */
export function getPluginRegistry(): PluginRegistry {
  if (!pluginRegistryInstance) {
    pluginRegistryInstance = new PluginRegistry();

    // グローバルエラーハンドラーを設定
    pluginRegistryInstance.onError(error => {
      console.error('Plugin System Error:', error);

      // TODO: エラー通知UIを実装
      // showErrorNotification(error);
    });
  }

  return pluginRegistryInstance;
}

/**
 * プラグインシステムを初期化
 */
export async function initializePluginSystem(): Promise<void> {
  console.log('Initializing Plugin System...');

  // プラグインビューマネージャーを初期化
  const viewManager = createGlobalPluginViewManager();
  console.log('Plugin View Manager initialized');

  // プラグインレジストリを初期化
  const registry = getPluginRegistry();

  // データベースから既存プラグインを読み込み
  try {
    await registry.initializeFromDatabase();
  } catch (error) {
    console.error('Failed to initialize plugins from database:', error);
  }

  // 開発モードでのデバッグ情報
  if (import.meta.env.DEV) {
    console.log('Plugin System initialized in development mode');

    // グローバルオブジェクトに追加（デバッグ用）
    (window as any).pluginRegistry = registry;
    (window as any).pluginViewManager = viewManager;
  }

  console.log('Plugin System ready');
}
