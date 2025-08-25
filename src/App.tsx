import { useState, useEffect } from 'react';
import { GraphQLTest } from './components/debug/GraphQLTest';
import { ImageUploadTest } from './components/debug/ImageUploadTest';
import { GraphQLSchemaExport } from './components/debug/GraphQLSchemaExport';
import { PluginManager } from './components/plugins';
import { PluginViewRenderer } from './components/PluginViewRenderer';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import MarkdownPage from './components/Markdown';
import BlockList from './components/BlockList';
import { Block } from './services/types';
import { type SidebarItem } from './components/Sidebar';
import { usePluginSidebar } from './hooks/usePluginSidebar';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedExperimentId, setSelectedExperimentId] = useState<
    string | null
  >(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  // カスタムフックでプラグインサイドバーアイテムを取得
  const pluginSidebarItems = usePluginSidebar();

  // プラグインビューリクエストイベントの監視
  useEffect(() => {
    const handlePluginViewRequest = (
      event: CustomEvent<{ viewId: string }>
    ) => {
      setCurrentView(event.detail.viewId);
    };

    window.addEventListener(
      'pluginViewRequested',
      handlePluginViewRequest as EventListener
    );

    return () => {
      window.removeEventListener(
        'pluginViewRequested',
        handlePluginViewRequest as EventListener
      );
    };
  }, []);

  // エクスペリメントクリック時の処理
  const handleExperimentClick = (experimentId: string) => {
    console.log('Experiment clicked from sidebar:', experimentId);
    setSelectedExperimentId(experimentId);
    setCurrentView('blockList');
  };

  // ブロッククリック時の処理
  const handleBlockClick = (block: Block) => {
    console.log('Block clicked:', block.id, block.type);
    setSelectedBlock(block);
    if (block.type === 'markdown') {
      setCurrentView('markdownPage');
    }
  };

  // 固定のサイドバーアイテム
  const fixedSidebarItems: SidebarItem[] = [
    {
      icon: '🏠',
      label: 'Home',
      onClick: () => setCurrentView('home'),
    },
    {
      icon: '🔍',
      label: 'GraphQL Test',
      onClick: () => setCurrentView('graphql'),
    },
    {
      icon: '📋',
      label: 'Schema Export',
      onClick: () => setCurrentView('schema'),
    },
    {
      icon: '🖼️',
      label: 'Image Upload',
      onClick: () => setCurrentView('image'),
    },
    {
      icon: '🔌',
      label: 'Plugin Manager',
      onClick: () => setCurrentView('plugins'),
    },
  ];

  // プラグインアイテムと固定アイテムを結合
  const allHoverItems = [...fixedSidebarItems, ...pluginSidebarItems];

  return (
    <Sidebar
      hoverItems={allHoverItems}
      setCurrentView={setCurrentView}
      onExperimentClick={handleExperimentClick}
      selectedWorkspaceId={selectedWorkspaceId}
    >
      {/* 表示コンテンツを条件分岐 */}
      {(() => {
        switch (currentView) {
          case 'home':
            return (
              <Home
                setCurrentView={setCurrentView}
                onWorkspaceChange={setSelectedWorkspaceId}
              />
            );

          case 'blockList':
            return (
              <BlockList
                experimentId={selectedExperimentId}
                onBlockClick={handleBlockClick}
              />
            );

          case 'markdownPage':
            return (
              <MarkdownPage
                experimentId={selectedExperimentId}
                selectedBlock={selectedBlock}
                onBack={() => setCurrentView('blockList')}
              />
            );

          case 'graphql':
            return <GraphQLTest />;

          case 'schema':
            return <GraphQLSchemaExport />;
          case 'image':
            return <ImageUploadTest />;

          case 'plugins':
            return <PluginManager />;

          default:
            // プラグインビューの処理
            const pluginView = (
              <PluginViewRenderer
                currentView={currentView}
                onNavigateHome={() => setCurrentView('home')}
              />
            );

            if (pluginView && currentView.startsWith('plugin:')) {
              return pluginView;
            }

            // デフォルトはHomeビューを表示
            return (
              <Home
                setCurrentView={setCurrentView}
                onWorkspaceChange={setSelectedWorkspaceId}
              />
            );
        }
      })()}
    </Sidebar>
  );
}

export default App;
