import { useState, useEffect, useRef } from "react";
import { GraphQLTest } from "./components/debug/GraphQLTest";
import { GraphQLSchemaExport } from "./components/GraphQLSchemaExport";
import { WebSocketClient } from "./components/WebSocketStatus";
import ConnectWidget from "./components/ConnectWidget";
import ConnectionStatus from "./components/ConnectionStatus";
import Sidebar from "./components/Sidebar";
import { AutomergeProvider } from "./components/AutomergeRepo";
import MarkdownEditor from "./components/MarkdownEditor"; // MarkdownEditorをインポート
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<
    "graphql" | "schema" | "server" | "home" | "markdown"
  >("home"); // "markdown" を追加
  const [sidebarFixed, setSidebarFixed] = useState(false);
  const SIDEBAR_WIDTH = 260;

  const [isConnected, setIsConnected] = useState(false);
  const [wsUrl, setWsUrl] = useState<string>("");
  const [serverName, setServerName] = useState<string>("");

  // 状態変化バナー（※二重定義しない）
  const [banner, setBanner] = useState<{
    show: boolean;
    kind: "connected" | "disconnected" | "error";
    message: string;
  }>({ show: false, kind: "connected", message: "" });

  // 直近の接続バナー時刻（重複防止）
  const lastConnectedAtRef = useRef<number>(0);
  const showConnectedBanner = () => {
    const now = Date.now();
    if (now - lastConnectedAtRef.current < 1500) return;
    lastConnectedAtRef.current = now;
    setBanner({
      show: true,
      kind: "connected",
      message: `Server: ${serverName || "(unnamed)"} / URL: ${wsUrl}`,
    });
  };

  // Serverビューでの接続フォームバナー表示管理
  const [showConnectBanner, setShowConnectBanner] = useState(true);
  useEffect(() => {
    if (currentView === "server") setShowConnectBanner(true);
  }, [currentView]);

  return (
    <div className="h-screen flex">
      <Sidebar
        items={[
          {
            icon: "🏠",
            label: "Home",
            onClick: () => setCurrentView("home"),
          },
          {
            icon: "🔍",
            label: "GraphQL Test",
            onClick: () => setCurrentView("graphql"),
          },
          {
            icon: "📋",
            label: "Schema Export",
            onClick: () => setCurrentView("schema"),
          },
          {
            icon: "鯖",
            label: "Collaborative Editing Mode",
            onClick: () => setCurrentView("server"),
          },
          {
            icon: "📝", // Markdown Editorのアイコン
            label: "Markdown Editor",
            onClick: () => setCurrentView("markdown"), // "markdown" に遷移
          },
        ]}
        onFixedChange={setSidebarFixed}
      />

      <div
        className={`flex-1 p-4 overflow-auto transition-all duration-300`}
        style={sidebarFixed ? { marginLeft: SIDEBAR_WIDTH } : {}}
      >
        <div style={!sidebarFixed ? { width: "90vw", maxWidth: "90%" } : { width: "100%" }}>
          {/* ★ ここでのみ状態変化のバナーを出す（右上の常時表示は撤去） */}
          <ConnectionStatus
            show={banner.show}
            kind={banner.kind}
            message={banner.message}
            onClose={() => setBanner((b) => ({ ...b, show: false }))}
          />

          <AutomergeProvider
            wsUrl={wsUrl}
            roomName={serverName || "default"}
            onStatusChange={(status) => {
              console.log("Automerge status:", status);

              const statusVal = status as string | boolean | undefined;

              const isUp =
                statusVal === "connected" ||
                statusVal === "open" ||
                statusVal === "ready" ||
                statusVal === true;

              const isDown =
                statusVal === "disconnected" ||
                statusVal === "closed" ||
                statusVal === false;

              const isErr =
                statusVal === "error" ||
                statusVal === "failed";

              if (isUp) {
                setIsConnected(true);
                showConnectedBanner();
                return;
              }
              if (isDown) {
                setIsConnected(false);
                setBanner({ show: true, kind: "disconnected", message: "" });
                return;
              }
              if (isErr) {
                setIsConnected(false);
                setBanner({ show: true, kind: "error", message: "接続エラーが発生しました" });
                return;
              }

              console.warn("Unknown status from AutomergeProvider:", status);
            }}
          >
            {/* 表示コンテンツを条件分岐 */}
            {(() => {
              switch (currentView) {
                case "home":
                  return (
                    <div className="text-center">
                      <h1 className="text-2xl font-bold mb-4">Love Note</h1>
                      <p>Electronic Lab Notebook with Tauri + React + SQLite</p>
                      <p>Switch to GraphQL Test to verify database operations.</p>
                    </div>
                  );

                case "graphql":
                  return <GraphQLTest />;

                case "server":
                  return (
                    <>
                      {/* Server画面の上部にだけ“接続バナー”を出す */}
                      {!isConnected && (
                        <ConnectWidget
                          connected={false}
                          show={showConnectBanner}
                          serverName={serverName}
                          wsUrl={wsUrl}
                          onConnect={({ url, name }) => {
                            setWsUrl(url);
                            setServerName(name);
                            // 実接続は WebSocketClient/AutomergeProvider が確立
                          }}
                          onHide={() => setShowConnectBanner(false)}
                          onShow={() => setShowConnectBanner(true)}
                        />
                      )}

                      {!isConnected && (
                        <div className="text-gray-500 text-center mb-4">
                          <p>WebSocket 未接続です</p>
                          <p>サーバが起動して接続が確立されると、ここにリアルタイム画面が表示されます。</p>
                        </div>
                      )}

                      <WebSocketClient
                        url={wsUrl}
                        onStatusChange={(connected) => {
                          setIsConnected(connected);
                          if (connected) showConnectedBanner();
                        }}
                        onDisconnect={(reason) => {
                          if (reason === "manual") {
                            setIsConnected(false);
                            setWsUrl("");
                            setServerName("");
                            setBanner({ show: true, kind: "disconnected", message: "手動で切断しました。" });
                          } else {
                            setIsConnected(false);
                            setBanner({ show: true, kind: "disconnected", message: "接続が切断されました。" });
                          }
                        }}
                      />
                    </>
                  );

                case "schema":
                  return <GraphQLSchemaExport />;

                case "markdown": // Markdown Editorを表示
                  return <MarkdownEditor />;

                default:
                  return null;
              }
            })()}
          </AutomergeProvider>
        </div>
      </div>

      {/* <ConnectWidget
        open={connectOpen}
        onCancel={() => setConnectOpen(false)}
        onConnect={({ url, name }) => {
          setWsUrl(url);
          setServerName(name);
          setIsConnected(true);
          setConnectOpen(false);
          setCurrentView("server");
        }}
      /> */}
    </div>
  );
}

export default App;