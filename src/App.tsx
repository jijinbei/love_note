import { useState, useEffect, useRef } from 'react';
import { GraphQLTest } from './components/debug/GraphQLTest';
import { ImageUploadTest } from './components/debug/ImageUploadTest';
import { GraphQLSchemaExport } from './components/GraphQLSchemaExport';
import { WebSocketClient } from './components/WebSocketStatus';
import ConnectWidget from './components/ConnectWidget';
import ConnectionStatus from './components/ConnectionStatus';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import { AutomergeProvider } from './components/AutomergeRepo';
import type { Workspace } from './generated/graphql';
import { useGraphQL } from './hooks/useGraphQL';
import MarkdownEditor from './components/Markdown/MarkdownEditor';
import MarkdownPage from './components/Markdown/MarkdownPage';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [sidebarFixed, setSidebarFixed] = useState(false);
  const SIDEBAR_WIDTH = 260;
  const [isConnected, setIsConnected] = useState(false);
  const [wsUrl, setWsUrl] = useState<string>('');
  const [serverName, setServerName] = useState<string>('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  );
  const { isLoading, error, setError, loadWorkspaces, createWorkspace } =
    useGraphQL();
  const [selectedExperimentId, setSelectedExperimentId] = useState<
    string | null
  >(null);

  // 状態変化バナー
  const [banner, setBanner] = useState<{
    show: boolean;
    kind: 'connected' | 'disconnected' | 'error';
    message: string;
  }>({ show: false, kind: 'connected', message: '' });

  // 直近の接続バナー時刻（重複防止）
  const lastConnectedAtRef = useRef<number>(0);
  const showConnectedBanner = () => {
    const now = Date.now();
    if (now - lastConnectedAtRef.current < 1500) return;
    lastConnectedAtRef.current = now;
    setBanner({
      show: true,
      kind: 'connected',
      message: `Server: ${serverName || '(unnamed)'} / URL: ${wsUrl}`,
    });
  };

  // Serverビューでの接続フォームバナー表示管理
  const [showConnectBanner, setShowConnectBanner] = useState(true);
  useEffect(() => {
    if (currentView === 'server') setShowConnectBanner(true);
  }, [currentView]);

  // エクスペリメントクリック時の処理
  const handleExperimentClick = (experimentId: string) => {
    console.log('Experiment clicked from sidebar:', experimentId);
    setSelectedExperimentId(experimentId);
    setCurrentView('markdownPage');
  };
  // ワークスペースを作成する関数
  const handleCreateWorkspace = async () => {
    const workspaceName = prompt('新しいワークスペース名を入力してください:');
    if (!workspaceName?.trim()) return;

    try {
      await createWorkspace(workspaceName);
      const workspacesData = await loadWorkspaces();
      setWorkspaces(workspacesData);
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  return (
    <div className="h-screen flex">
      <Sidebar
        items={[
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
            icon: '鯖',
            label: 'Collaborative Editing Mode',
            onClick: () => setCurrentView('server'),
          },
          {
            icon: '📝',
            label: 'Markdown Editor',
            onClick: () => setCurrentView('markdown'),
          },
          {
            icon: '🖼️',
            label: 'Image Upload',
            onClick: () => setCurrentView('image'),
          },
        ]}
        onFixedChange={setSidebarFixed}
        setCurrentView={setCurrentView}
        onExperimentClick={handleExperimentClick}
      />

      <div
        className={`flex-1 p-4 overflow-auto transition-all duration-300 ${
          sidebarFixed ? 'ml-[260px]' : ''
        }`}
      >
        <div className={`${!sidebarFixed ? 'w-[90vw] max-w-[90%]' : 'w-full'}`}>
          <ConnectionStatus
            show={banner.show}
            kind={banner.kind}
            message={banner.message}
            onClose={() => setBanner(b => ({ ...b, show: false }))}
          />

          <AutomergeProvider
            wsUrl={wsUrl}
            roomName={serverName || 'default'}
            onStatusChange={status => {
              console.log('Automerge status:', status);

              const statusVal = status as string | boolean | undefined;

              const isUp =
                statusVal === 'connected' ||
                statusVal === 'open' ||
                statusVal === 'ready' ||
                statusVal === true;

              const isDown =
                statusVal === 'disconnected' ||
                statusVal === 'closed' ||
                statusVal === false;

              const isErr = statusVal === 'error' || statusVal === 'failed';

              if (isUp) {
                setIsConnected(true);
                showConnectedBanner();
                return;
              }
              if (isDown) {
                setIsConnected(false);
                setBanner({ show: true, kind: 'disconnected', message: '' });
                return;
              }
              if (isErr) {
                setIsConnected(false);
                setBanner({
                  show: true,
                  kind: 'error',
                  message: '接続エラーが発生しました',
                });
                return;
              }

              console.warn('Unknown status from AutomergeProvider:', status);
            }}
          >
            {/* 表示コンテンツを条件分岐 */}
            {(() => {
              switch (currentView) {
                case 'home':
                  return (
                    <Home
                      workspaces={workspaces}
                      selectedWorkspace={selectedWorkspace}
                      isLoading={isLoading}
                      setSelectedWorkspace={setSelectedWorkspace}
                      handleCreateWorkspace={handleCreateWorkspace}
                      setCurrentView={setCurrentView}
                    />
                  );

                case 'markdownPage':
                  return <MarkdownPage experimentId={selectedExperimentId} />;

                case 'graphql':
                  return <GraphQLTest />;

                case 'server':
                  return (
                    <>
                      {/* Server画面の上部にだけ"接続バナー"を出す */}
                      {!isConnected && (
                        <ConnectWidget
                          connected={false}
                          show={showConnectBanner}
                          serverName={serverName}
                          wsUrl={wsUrl}
                          onConnect={({ url, name }) => {
                            setWsUrl(url);
                            setServerName(name);
                          }}
                          onHide={() => setShowConnectBanner(false)}
                          onShow={() => setShowConnectBanner(true)}
                        />
                      )}

                      {!isConnected && (
                        <div className="text-gray-500 text-center mb-4">
                          <p>WebSocket 未接続です</p>
                          <p>
                            サーバが起動して接続が確立されると、ここにリアルタイム画面が表示されます。
                          </p>
                        </div>
                      )}

                      <WebSocketClient
                        url={wsUrl}
                        onStatusChange={connected => {
                          setIsConnected(connected);
                          if (connected) showConnectedBanner();
                        }}
                        onDisconnect={reason => {
                          if (reason === 'manual') {
                            setIsConnected(false);
                            setWsUrl('');
                            setServerName('');
                            setBanner({
                              show: true,
                              kind: 'disconnected',
                              message: '手動で切断しました。',
                            });
                          } else {
                            setIsConnected(false);
                            setBanner({
                              show: true,
                              kind: 'disconnected',
                              message: '接続が切断されました。',
                            });
                          }
                        }}
                      />
                    </>
                  );

                case 'schema':
                  return <GraphQLSchemaExport />;

                case 'markdown':
                  return <MarkdownEditor />;

                case 'image':
                  return <ImageUploadTest />;

                default:
                  return null;
              }
            })()}
          </AutomergeProvider>
        </div>
      </div>
    </div>
  );
}

export default App;
