import { useState, useEffect } from 'react';
import { type SidebarItem } from '../components/Sidebar';

/**
 * プラグインサイドバーアイテムを管理するカスタムフック
 */
export function usePluginSidebar() {
  const [pluginSidebarItems, setPluginSidebarItems] = useState<SidebarItem[]>([]);

  useEffect(() => {
    const updatePluginSidebarItems = () => {
      if (window.pluginViewManager) {
        const sidebarItems = window.pluginViewManager.getSidebarItems();
        const mappedItems: SidebarItem[] = sidebarItems.map(item => ({
          icon: item.icon,
          label: item.label,
          onClick: () => {
            // カスタムイベントを発行してApp.tsxに通知
            window.dispatchEvent(new CustomEvent('pluginViewRequested', {
              detail: { viewId: `plugin:${item.id}` }
            }));
          },
        }));
        setPluginSidebarItems(mappedItems);
      }
    };

    // 初回実行
    updatePluginSidebarItems();

    // プラグインビューマネージャーの変更を監視
    let unsubscribe: (() => void) | undefined;
    if (window.pluginViewManager) {
      unsubscribe = window.pluginViewManager.addChangeListener(updatePluginSidebarItems);
    }

    // 定期的にチェック（pluginViewManagerが後から利用可能になる場合に対応）TODO:bad code
    const interval = setInterval(() => {
      if (window.pluginViewManager && !unsubscribe) {
        unsubscribe = window.pluginViewManager.addChangeListener(updatePluginSidebarItems);
        updatePluginSidebarItems();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return pluginSidebarItems;
}