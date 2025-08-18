import { useState } from 'react';
import { GraphQLTest } from './components/debug/GraphQLTest';
import { ImageUploadTest } from './components/debug/ImageUploadTest';
import { GraphQLSchemaExport } from './components/debug/GraphQLSchemaExport';
import { PluginManager } from './components/Plugins';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import MarkdownPage from './components/Markdown';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedExperimentId, setSelectedExperimentId] = useState<
    string | null
  >(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );

  // エクスペリメントクリック時の処理
  const handleExperimentClick = (experimentId: string) => {
    console.log('Experiment clicked from sidebar:', experimentId);
    setSelectedExperimentId(experimentId);
    setCurrentView('markdownPage');
  };

  return (
    <Sidebar
      hoverItems={[
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
      ]}
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

          case 'markdownPage':
            return <MarkdownPage experimentId={selectedExperimentId} />;

          case 'graphql':
            return <GraphQLTest />;

          case 'schema':
            return <GraphQLSchemaExport />;
          case 'image':
            return <ImageUploadTest />;

          case 'plugins':
            return <PluginManager />;

          default:
            return null;
        }
      })()}
    </Sidebar>
  );
}

export default App;
