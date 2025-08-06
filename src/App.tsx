import { useState } from "react";
import { GraphQLTest } from "./components/GraphQLTest";
import { GraphQLSchemaExport } from "./components/GraphQLSchemaExport";
import ConnectWidget from "./components/ConnectWidget";
import ConnectionStatus from "./components/ConnectionStatus";
import Sidebar from "./components/Sidebar";
import SharedNotes from "./components/SharedNotes";
import { AutomergeProvider } from "./components/AutomergeRepo";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<"graphql" | "schema" | "server" | "home">(
    "home"
  );
  const [sidebarFixed, setSidebarFixed] = useState(false);
  const SIDEBAR_WIDTH = 260;

  const [connectOpen, setConnectOpen] = useState(false);
  const [wsUrl, setWsUrl] = useState<string>("");
  const [serverName, setServerName] = useState<string>("");
  const connected = !!wsUrl;

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

          {/* 共同編集させたいビューを Provider で包む */}
          <AutomergeProvider wsUrl={wsUrl} roomName={serverName || "default"}>
            {currentView === "home" ? (
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Love Note</h1>
                <p>Electronic Lab Notebook with Tauri + React + SQLite</p>
                <p>Switch to GraphQL Test to verify database operations.</p>
              </div>
            ) : currentView === "graphql" ? (
              <>
                <GraphQLTest />
                {/* 下に共同編集用の UI を載せて同期確認できるように */}
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-2">Collaborative Notes (Automerge v2)</h2>
                  <SharedNotes />
                </div>
              </>
            ) : (
              <GraphQLSchemaExport />
            )}
          </AutomergeProvider>
        </div>
      </div>

      <ConnectWidget
        open={connectOpen}
        onCancel={() => setConnectOpen(false)}
        onConnect={({ url, name }) => {
          setWsUrl(url);
          setServerName(name);
          setConnectOpen(false);
          setCurrentView("graphql"); // 接続後に共同編集画面へ
        }}
      />
    </div>
  );
}

export default App;
