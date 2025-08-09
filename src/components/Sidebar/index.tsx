import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkspaceSelector } from './WorkspaceSelector';
import { WorkspaceContentItem } from './WorkspaceContentItem';
import { useGraphQL } from '../../hooks/useGraphQL';
import { SIDEBAR_WIDTH } from '../../utils/constants';
import type { Workspace } from '../../generated/graphql';

export type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

type SidebarProps = {
  items: SidebarItem[];
  onFixedChange?: (fixed: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ items, onFixedChange }) => {
  const [fixedOpen, setFixedOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const hoverAreaRef = useRef<HTMLDivElement>(null);
  
  // GraphQL data states
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  
  const { isLoading, error, setError, loadWorkspaces, createWorkspace } = useGraphQL();

  // fixedOpenの変更時に親へ通知
  useEffect(() => {
    if (typeof onFixedChange === "function") {
      onFixedChange(fixedOpen);
    }
  }, [fixedOpen, onFixedChange]);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const workspacesData = await loadWorkspaces();
        setWorkspaces(workspacesData);
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      }
    };
    loadData();
  }, [loadWorkspaces]);

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspace]);

  useEffect(() => {
    if (fixedOpen) return;
    const handleMouseMove = (e: MouseEvent) => {
      setHovering(e.clientX < 24);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [fixedOpen]);

  const isSidebarOpen = fixedOpen || hovering || sidebarHovered;

  const sidebarIcon = (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" />
      <line x1="8" y1="3" x2="8" y2="21" stroke="currentColor" />
    </svg>
  );

  const handleCreateWorkspace = async () => {
    const workspaceName = prompt("新しいワークスペース名を入力してください:");
    if (!workspaceName?.trim()) return;
    
    try {
      await createWorkspace(workspaceName);
      // Reload workspaces
      const workspacesData = await loadWorkspaces();
      setWorkspaces(workspacesData);
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  const [refreshLoading, setRefreshLoading] = useState(false);

  const handleRefresh = async () => {
    setRefreshLoading(true);
    setError('');
    try {
      // 最低500msはローディング表示を維持（アニメーションを見せるため）
      const [workspacesData] = await Promise.all([
        loadWorkspaces(),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      setWorkspaces(workspacesData);
    } catch (error) {
      console.error('Error refreshing workspaces:', error);
    } finally {
      setRefreshLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 left-0 h-screen z-40 bg-white text-gray-600 shadow-lg border-r border-gray-200 overflow-hidden flex flex-col"
            onMouseEnter={() => setSidebarHovered(true)}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            {/* ヘッダー */}
            <div className="flex items-center px-6 py-4 border-b border-gray-100">
              <span className="font-bold text-lg">Menu</span>
              <div className="flex-1" />
              
              {/* リフレッシュボタン */}
              <button
                className={`p-1.5 rounded hover:bg-gray-100 transition ${
                  refreshLoading ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={refreshLoading ? "データを更新中..." : "データを更新"}
                onClick={handleRefresh}
                disabled={refreshLoading}
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className={refreshLoading ? 'animate-spin' : ''}
                >
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </button>
              
              <button
                onClick={() => setFixedOpen((prev) => !prev)}
                className={`p-1.5 rounded hover:bg-gray-100 transition ml-2 ${
                  fixedOpen ? "text-blue-500" : "text-gray-400"
                }`}
                title={
                  fixedOpen ? "サイドバーを閉じる" : "サイドバーを固定表示"
                }
              >
                {sidebarIcon}
              </button>
            </div>

            {/* コンテンツ */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 py-4">
                <ul className="space-y-1 px-4">
                  {items.map((item) => (
                    <li key={item.label}>
                      <button
                        onClick={item.onClick}
                        className="flex items-center w-full text-left px-4 py-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                  
                  {/* エラー表示 */}
                  {error && (
                    <li className="text-red-600 text-xs p-2 bg-red-50 border border-red-200 rounded-md mb-2">
                      ❌ {error}
                    </li>
                  )}
                  
                  {/* ローディング表示 */}
                  {isLoading && (
                    <li className="text-gray-600 text-xs p-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      Loading...
                    </li>
                  )}
                  
                  {/* 選択されたワークスペースのプロジェクト・実験のみ表示 */}
                  {selectedWorkspace && (
                    <WorkspaceContentItem workspaceId={selectedWorkspace} />
                  )}
                  
                  {/* ワークスペースが選択されていない場合 */}
                  {!selectedWorkspace && workspaces.length === 0 && !isLoading && (
                    <li className="text-gray-500 text-xs italic p-2 text-center">
                      No workspaces found.
                    </li>
                  )}
                </ul>
              </div>
              
              {/* ワークスペース選択UI */}
              <WorkspaceSelector
                workspaces={workspaces}
                selectedWorkspace={selectedWorkspace}
                isLoading={isLoading}
                onWorkspaceChange={setSelectedWorkspace}
                onCreateWorkspace={handleCreateWorkspace}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ホバーエリア */}
      {!isSidebarOpen && !fixedOpen && (
        <div
          className="fixed top-0 left-0 h-full w-2 z-50"
          ref={hoverAreaRef}
        />
      )}
    </>
  );
};

export default Sidebar;