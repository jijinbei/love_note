import { useState } from "react";
import { HierarchicalTest } from "./components/HierarchicalTest";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<"hierarchical" | "home">(
    "hierarchical"
  );
  const [sidebarFixed, setSidebarFixed] = useState(false);
  const SIDEBAR_WIDTH = 260;

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
            icon: "📂",
            label: "Hierarchical Test",
            onClick: () => setCurrentView("hierarchical"),
          },
        ]}
        onFixedChange={setSidebarFixed}
      />

      {/* メインビュー */}
      <div
        className={`flex-1 p-4 overflow-auto transition-all duration-300 ${
          !sidebarFixed ? "flex justify-end" : ""
        }`}
        style={sidebarFixed ? { marginLeft: SIDEBAR_WIDTH } : {}}
      >
        <div
          style={
            !sidebarFixed
              ? { width: "90vw", maxWidth: "90%" }
              : { width: "100%" }
          }
        >
          {currentView === "home" ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Love Note</h1>
              <p>Electronic Lab Notebook with Tauri + React + SQLite</p>
              <p>Switch to Hierarchical Test to verify database operations.</p>
            </div>
          ) : (
            <HierarchicalTest />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
