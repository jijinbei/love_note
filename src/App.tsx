import { useState } from "react";
import { GraphQLTest } from "./components/GraphQLTest";
import { GraphQLSchemaExport } from "./components/GraphQLSchemaExport";
import { WebSocketClient } from "./components/WebSocketStatus";
import ConnectWidget from "./components/ConnectWidget";
import ConnectionStatus from "./components/ConnectionStatus";
import Sidebar from "./components/Sidebar";
import { AutomergeProvider } from "./components/AutomergeRepo";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<"graphql" | "schema" | "server" | "home">(
    "home"
  );
  const [sidebarFixed, setSidebarFixed] = useState(false);
  const SIDEBAR_WIDTH = 260;

  const [connectOpen, setConnectOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [wsUrl, setWsUrl] = useState<string>("");
  const [serverName, setServerName] = useState<string>("");
  const connected = isConnected;

  return (
    <div className="h-screen flex">
      {/* サイドバーは常に表示。固定状態はSidebarから通知 */}
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
            onClick: () => {
              setCurrentView("server");
              setConnectOpen(true); 
          },
        },
      ]}
      onFixedChange={setSidebarFixed}
      />

      <div
        className={`flex-1 p-4 overflow-auto transition-all duration-300 ${!sidebarFixed ? "flex justify-end" : ""}`}
        style={sidebarFixed ? { marginLeft: SIDEBAR_WIDTH } : {}}
      >
        <div style={!sidebarFixed ? { width: "90vw", maxWidth: "90%" } : { width: "100%" }}>
          
          {/* 接続状態 */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <ConnectionStatus connected={connected} serverName={serverName} url={wsUrl} />
          </div>

          {/* Automerge Provider ラップ */}
          <AutomergeProvider
              wsUrl={wsUrl}
              roomName={serverName || "default"}
              onStatusChange={(status) => {
                if (status === "connected") {
                  setIsConnected(true);
                } else if (status === "disconnected" || status === "error") {
                  setIsConnected(false);
                }
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
                      {!connected && (
                        <div className="text-gray-500 text-center mb-4">
                          <p>WebSocket 未接続です</p>
                          <p>サーバが起動して接続が確立されると、ここにリアルタイム画面が表示されます。</p>
                        </div>
                      )}
                      <WebSocketClient
                        url={wsUrl}
                        onStatusChange={(connected) => setIsConnected(connected)}
                        onDisconnect={(reason) => {
                          if (reason === "manual") {
                            setIsConnected(false);
                            setWsUrl("");
                            setServerName("");
                            setCurrentView("home");
                          } else {
                            setIsConnected(false); // エラーや自然切断時
                          }
                        }}
                      />
                    </>
                  );

                case "schema":
                default:
                  return <GraphQLSchemaExport />;
              }
            })()}
          </AutomergeProvider>
        </div>
      </div>

      <ConnectWidget
        open={connectOpen}
        onCancel={() => setConnectOpen(false)}
        onConnect={({ url, name }) => {
          setWsUrl(url);
          setServerName(name);
          setIsConnected(true);
          setConnectOpen(false);
          setCurrentView("server");
        }}
      />
    </div>
  );
}

export default App;
