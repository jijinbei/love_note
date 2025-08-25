// Plugin View Manager - プラグインのサイドバーアイテムとビューを管理

import React from 'react';

export interface PluginSidebarItem {
  id: string;
  icon: string;
  label: string;
  view: React.ComponentType<any>;
}

export interface PluginView {
  pluginId: string;
  itemId: string;
  sidebarItem: PluginSidebarItem;
}

// Windowにプラグインビューマネージャーを追加
declare global {
  interface Window {
    pluginViewManager?: PluginViewManager;
  }
}

export class PluginViewManager {
  private pluginViews = new Map<string, PluginView>();
  private changeListeners: (() => void)[] = [];

  /**
   * プラグインビューを登録
   */
  registerPluginView(
    pluginId: string,
    itemId: string,
    sidebarItem: PluginSidebarItem
  ): void {
    const viewId = `${pluginId}-${itemId}`;
    const pluginView: PluginView = {
      pluginId,
      itemId,
      sidebarItem,
    };

    this.pluginViews.set(viewId, pluginView);
    this.notifyListeners();

    console.log(
      `PluginViewManager: Registered view ${viewId} for plugin ${pluginId}`
    );
  }

  /**
   * プラグインビューの登録解除
   */
  unregisterPluginView(pluginId: string, itemId: string): void {
    const viewId = `${pluginId}-${itemId}`;
    const removed = this.pluginViews.delete(viewId);

    if (removed) {
      this.notifyListeners();
      console.log(
        `PluginViewManager: Unregistered view ${viewId} for plugin ${pluginId}`
      );
    }
  }

  /**
   * プラグインのすべてのビューを削除
   */
  unregisterAllViews(pluginId: string): void {
    const viewsToRemove = Array.from(this.pluginViews.entries()).filter(
      ([_, view]) => view.pluginId === pluginId
    );

    for (const [viewId] of viewsToRemove) {
      this.pluginViews.delete(viewId);
    }

    if (viewsToRemove.length > 0) {
      this.notifyListeners();
      console.log(
        `PluginViewManager: Removed ${viewsToRemove.length} views for plugin ${pluginId}`
      );
    }
  }

  /**
   * 登録されたプラグインビューの一覧を取得
   */
  getAllPluginViews(): PluginView[] {
    return Array.from(this.pluginViews.values());
  }

  /**
   * サイドバーアイテムの一覧を取得
   */
  getSidebarItems(): PluginSidebarItem[] {
    return Array.from(this.pluginViews.values()).map(view => view.sidebarItem);
  }

  /**
   * 特定のアイテムIDでビューを検索
   */
  getViewByItemId(itemId: string): PluginView | undefined {
    return Array.from(this.pluginViews.values()).find(
      view => view.sidebarItem.id === itemId
    );
  }

  /**
   * 変更リスナーを追加
   */
  addChangeListener(listener: () => void): () => void {
    this.changeListeners.push(listener);

    // リスナーを削除する関数を返す
    return () => {
      const index = this.changeListeners.indexOf(listener);
      if (index !== -1) {
        this.changeListeners.splice(index, 1);
      }
    };
  }

  /**
   * すべてのリスナーに変更を通知
   */
  private notifyListeners(): void {
    this.changeListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in plugin view change listener:', error);
      }
    });
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    const views = this.getAllPluginViews();
    const pluginCounts = new Map<string, number>();

    views.forEach(view => {
      const count = pluginCounts.get(view.pluginId) || 0;
      pluginCounts.set(view.pluginId, count + 1);
    });

    return {
      totalViews: views.length,
      totalPlugins: pluginCounts.size,
      pluginCounts: Object.fromEntries(pluginCounts),
    };
  }
}

// グローバルインスタンスを作成
export const createGlobalPluginViewManager = (): PluginViewManager => {
  if (!window.pluginViewManager) {
    window.pluginViewManager = new PluginViewManager();
  }
  return window.pluginViewManager;
};
