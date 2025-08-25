interface PluginViewRendererProps {
  currentView: string;
  onNavigateHome: () => void;
}

/**
 * プラグインビューのレンダリング処理を担当するコンポーネント
 */
export function PluginViewRenderer({
  currentView,
  onNavigateHome,
}: PluginViewRendererProps) {
  // プラグインビューの表示
  if (currentView.startsWith('plugin:')) {
    const pluginViewId = currentView.replace('plugin:', '');

    if (window.pluginViewManager) {
      const pluginView = window.pluginViewManager.getViewByItemId(pluginViewId);

      if (pluginView) {
        const PluginViewComponent = pluginView.sidebarItem.view;
        return <PluginViewComponent />;
      }
    }

    // プラグインビューが見つからない場合
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Plugin View Not Found
          </h2>
          <p className="text-gray-600">
            The requested plugin view could not be loaded.
          </p>
          <button
            onClick={onNavigateHome}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
