// Plugin List - インストール済みプラグインの一覧表示

import React, { useState, useEffect } from 'react';
import { PluginDescriptor } from '../../plugins/types';
import { getPluginRegistry } from '../../plugins';

interface PluginListProps {
  onPluginChange?: () => void;
}

export const PluginList: React.FC<PluginListProps> = ({ onPluginChange }) => {
  const [plugins, setPlugins] = useState<PluginDescriptor[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const pluginRegistry = getPluginRegistry();

  const loadPlugins = () => {
    const installedPlugins = pluginRegistry.getInstalledPlugins();
    setPlugins(installedPlugins);
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  const handleTogglePlugin = async (
    pluginId: string,
    currentStatus: string
  ) => {
    setLoading(pluginId);

    try {
      if (currentStatus === 'loaded') {
        // プラグインを無効化（DB更新 + アンロード）
        await pluginRegistry.disablePluginById(pluginId);
      } else {
        // プラグインを有効化（DB更新 + ロード）
        await pluginRegistry.enablePluginById(pluginId);
      }

      loadPlugins();
      onPluginChange?.();
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to toggle plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleReloadPlugin = async (pluginId: string) => {
    setLoading(pluginId);

    try {
      await pluginRegistry.reloadPlugin(pluginId);
      loadPlugins();
      onPluginChange?.();
    } catch (error) {
      console.error('Failed to reload plugin:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to reload plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleRemovePlugin = async (pluginId: string) => {
    if (!confirm('Are you sure you want to remove this plugin?')) {
      return;
    }

    setLoading(pluginId);

    try {
      await pluginRegistry.removePlugin(pluginId);
      loadPlugins();
      onPluginChange?.();
    } catch (error) {
      console.error('Failed to remove plugin:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to remove plugin: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'disabled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loaded':
        return '✅';
      case 'error':
        return '❌';
      case 'disabled':
        return '⏸️';
      default:
        return '❓';
    }
  };

  if (plugins.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">🔌</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Plugins Installed
        </h3>
        <p className="text-sm">
          Install your first plugin using the drop zone above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Installed Plugins ({plugins.length})
      </h3>

      <div className="space-y-3">
        {plugins.map(plugin => (
          <div
            key={plugin.id}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between">
              {/* プラグイン情報 */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-base font-medium text-gray-900">
                    {plugin.name}
                  </h4>
                  <span
                    className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${getStatusColor(plugin.status)}
                  `}
                  >
                    <span className="mr-1">{getStatusIcon(plugin.status)}</span>
                    {plugin.status}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>Version: {plugin.version}</p>
                  {plugin.description && (
                    <p>Description: {plugin.description}</p>
                  )}
                  {plugin.author && <p>Author: {plugin.author}</p>}
                  {plugin.loadedAt && (
                    <p>Loaded: {plugin.loadedAt.toLocaleString()}</p>
                  )}
                </div>

                {/* エラー表示 */}
                {plugin.status === 'error' && plugin.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {plugin.error}
                  </div>
                )}
              </div>

              {/* アクションボタン */}
              <div className="flex items-center space-x-2 ml-4">
                {/* 有効化/無効化ボタン */}
                <button
                  onClick={() => handleTogglePlugin(plugin.id, plugin.status)}
                  disabled={loading === plugin.id}
                  className={`
                    px-3 py-1 rounded text-sm font-medium transition-colors
                    ${
                      plugin.status === 'loaded'
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }
                    ${loading === plugin.id ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {loading === plugin.id
                    ? '...'
                    : plugin.status === 'loaded'
                      ? 'Disable'
                      : 'Enable'}
                </button>

                {/* リロードボタン - loaded状態の時のみ表示 */}
                {plugin.status === 'loaded' && (
                  <button
                    onClick={() => handleReloadPlugin(plugin.id)}
                    disabled={loading === plugin.id}
                    className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === plugin.id ? '...' : 'Reload'}
                  </button>
                )}

                {/* 削除ボタン */}
                <button
                  onClick={() => handleRemovePlugin(plugin.id)}
                  disabled={loading === plugin.id}
                  className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === plugin.id ? '...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
