// Plugin System Entry Point

export { PluginRegistry } from './PluginRegistry';
export { createESModuleLoader } from './ESModuleLoader';
export { PluginAPI } from './PluginAPI';
export * from './types';

// プラグインシステムのシングルトンインスタンス
import { PluginRegistry } from './PluginRegistry';

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
export function initializePluginSystem(): void {
  console.log('Initializing Plugin System...');

  // プラグインレジストリを初期化
  const registry = getPluginRegistry();

  // 開発モードでのデバッグ情報
  if (import.meta.env.DEV) {
    console.log('Plugin System initialized in development mode');

    // グローバルオブジェクトに追加（デバッグ用）
    (window as any).pluginRegistry = registry;
  }

  console.log('Plugin System ready');
}
