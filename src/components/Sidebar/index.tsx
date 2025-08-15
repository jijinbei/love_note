import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SIDEBAR_WIDTH } from '../../utils/constants';
import { useSidebarState } from './hooks/useSidebarState';
import { useSidebarResize } from './hooks/useSidebarResize';
import { SidebarHeader } from './components/SidebarHeader';
import { ResizeHandle } from './components/ResizeHandle';
import { WorkspaceContentItem } from './components/WorkspaceContentItem';
import { SIDEBAR_STYLES, ANIMATION_CONFIG } from './constants';
import HoverSidebar from './components/HoverSidebar';

export type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

type SidebarProps = {
  hoverItems: SidebarItem[];
  setCurrentView: (view: string) => void;
  onExperimentClick?: (experimentId: string) => void;
  selectedWorkspaceId?: string | null;
  children: React.ReactNode;
};

const Sidebar: React.FC<SidebarProps> = ({
  hoverItems,
  setCurrentView: _setCurrentView,
  onExperimentClick,
  selectedWorkspaceId,
  children,
}) => {
  // Custom hooks for state management
  const sidebarState = useSidebarState();
  const { sidebarWidth, isResizing, startResizing } =
    useSidebarResize(SIDEBAR_WIDTH);

  const {
    fixedOpen,
    setFixedOpen,
    isSidebarOpen,
    setSidebarHovered,
    hoverAreaRef,
  } = sidebarState;

  const handleToggleFixed = () => {
    setFixedOpen(!fixedOpen);
  };

  return (
    <div className={SIDEBAR_STYLES.container}>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: sidebarWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              type: ANIMATION_CONFIG.type,
              duration: isResizing ? 0 : ANIMATION_CONFIG.duration,
            }}
            className={SIDEBAR_STYLES.sidebar}
            onMouseEnter={() => setSidebarHovered(true)}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            {/* ヘッダー */}
            <SidebarHeader
              fixedOpen={fixedOpen}
              onToggleFixed={handleToggleFixed}
            />

            {/* HoverSidebar */}
            <HoverSidebar items={hoverItems} />

            {/* コンテンツ */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 py-4">
                <ul className="space-y-1 px-4">
                  {/* 選択されたワークスペースのプロジェクト・実験のみ表示 */}
                  {selectedWorkspaceId && (
                    <WorkspaceContentItem
                      workspaceId={selectedWorkspaceId}
                      onExperimentClick={onExperimentClick}
                    />
                  )}

                  {/* ワークスペースが選択されていない場合 */}
                  {!selectedWorkspaceId && (
                    <li className="text-gray-500 text-xs italic p-2 text-center">
                      No workspace selected. Please select a workspace from the
                      Home screen.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* リサイズハンドル */}
            <ResizeHandle visible={fixedOpen} onStartResize={startResizing} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ホバーエリア */}
      {!isSidebarOpen && !fixedOpen && (
        <div className={SIDEBAR_STYLES.hoverArea} ref={hoverAreaRef} />
      )}

      {/* メインコンテンツ領域 */}
      <div
        className={`${SIDEBAR_STYLES.mainContent} ${
          isResizing ? '' : 'transition-all duration-300'
        }`}
        style={{
          marginLeft: fixedOpen ? `${sidebarWidth}px` : 0,
        }}
      >
        <div className={SIDEBAR_STYLES.mainContentInner}>{children}</div>
      </div>
    </div>
  );
};

export default Sidebar;
