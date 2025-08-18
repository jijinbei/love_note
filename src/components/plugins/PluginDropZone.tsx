// Plugin File Selector - プラグインのファイル選択インストール

import React, { useState, useCallback } from 'react';
import { getPluginRegistry } from '../../plugins';

interface PluginDropZoneProps {
  onPluginInstalled?: (pluginId: string) => void;
}

export const PluginDropZone: React.FC<PluginDropZoneProps> = ({
  onPluginInstalled,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>(
    'info'
  );

  const pluginRegistry = getPluginRegistry();

  const showMessage = (
    text: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      setIsInstalling(true);

      try {
        for (const file of Array.from(files)) {
          try {
            const descriptor = await pluginRegistry.installFromFile(file);
            showMessage(
              `Successfully installed plugin: ${descriptor.name}`,
              'success'
            );
            onPluginInstalled?.(descriptor.id);
          } catch (error) {
            console.error('Failed to install plugin:', error);
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            showMessage(
              `Failed to install ${file.name}: ${errorMessage}`,
              'error'
            );
          }
        }
      } finally {
        setIsInstalling(false);
        // ファイル入力をリセット
        e.target.value = '';
      }
    },
    [pluginRegistry, onPluginInstalled]
  );

  return (
    <div className="space-y-4">
      {/* ファイル選択エリア */}
      <div
        className={`
          border-2 border-solid rounded-lg p-8 text-center transition-all duration-200
          border-gray-300 hover:border-gray-400
          ${isInstalling ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="space-y-4">
          {/* アイコン */}
          <div className="text-4xl">{isInstalling ? '⏳' : '🔌'}</div>

          {/* メインテキスト */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {isInstalling ? 'Installing Plugin...' : 'Install Plugin'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isInstalling
                ? 'Please wait while the plugin is being installed'
                : 'Click to select JavaScript files'}
            </p>
          </div>

          {/* ファイル選択ボタン */}
          {!isInstalling && (
            <div>
              <input
                type="file"
                accept=".js,.mjs"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="plugin-file-input"
              />
              <label
                htmlFor="plugin-file-input"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer transition-colors"
              >
                Select Files
              </label>
            </div>
          )}

          {/* サポートされるファイル形式 */}
          <p className="text-xs text-gray-400">Supported formats: .js, .mjs</p>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div
          className={`
          p-4 rounded-md border
          ${messageType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
          ${messageType === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
          ${messageType === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
        `}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {messageType === 'success' && '✅'}
              {messageType === 'error' && '❌'}
              {messageType === 'info' && 'ℹ️'}
            </span>
            <span className="text-sm font-medium">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
