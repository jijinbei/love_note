// Plugin Manager - プラグイン管理のメインコンポーネント

import React, { useState } from 'react';
import { PluginDropZone } from './PluginDropZone';
import { PluginList } from './PluginList';
import { getPluginRegistry } from '../../plugins';

export const PluginManager: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const pluginRegistry = getPluginRegistry();

  const handlePluginChange = () => {
    // プラグインリストを強制更新
    setRefreshKey(prev => prev + 1);
  };

  const stats = pluginRegistry.getStats();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* ヘッダー */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Plugin Manager
        </h1>
        <p className="text-gray-600">
          Install and manage plugins for Love Note
        </p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.loaded}
          </div>
          <div className="text-sm text-gray-600">Loaded</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          <div className="text-sm text-gray-600">Error</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {stats.disabled}
          </div>
          <div className="text-sm text-gray-600">Disabled</div>
        </div>
      </div>

      {/* インストールセクション */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Install Plugin
        </h2>

        <div className="space-y-4">
          <PluginDropZone onPluginInstalled={handlePluginChange} />
        </div>
      </div>

      {/* プラグイン一覧 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <PluginList key={refreshKey} onPluginChange={handlePluginChange} />
      </div>

      {/* 開発者情報 */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          For Developers
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Minimum Plugin Example:</strong>
          </p>
          <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
            {`export default {
  name: 'My Plugin',
  onLoad(api) {
    api.addButton('Hello', () => {
      api.showMessage('Hello from plugin!');
    });
  }
};`}
          </pre>
          <p className="mt-2">
            Save this as a <code className="bg-white px-1 rounded">.js</code>{' '}
            file and use the file selector above.
          </p>
        </div>
      </div>
    </div>
  );
};
