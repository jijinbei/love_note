import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

type SidebarProps = {
  items: SidebarItem[];
  onFixedChange?: (fixed: boolean) => void;
};

const SIDEBAR_WIDTH = 260;
const SIDEBAR_PADDING = 80;

const Sidebar: React.FC<SidebarProps> = ({ items, onFixedChange }) => {
  const [fixedOpen, setFixedOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const hoverAreaRef = useRef<HTMLDivElement>(null);

  // fixedOpenの変更時に親へ通知
  React.useEffect(() => {
    if (typeof onFixedChange === "function") {
      onFixedChange(fixedOpen);
    }
  }, [fixedOpen, onFixedChange]);

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

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 left-0 h-full z-40 bg-white text-gray-600 shadow-lg border-r border-gray-200 overflow-hidden"
            onMouseEnter={() => setSidebarHovered(true)}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            {/* ヘッダー */}
            <div className="flex items-center px-6 py-4 border-b border-gray-100">
              <span className="font-bold text-lg">Menu</span>
              <div className="flex-1" />
              <button
                onClick={() => setFixedOpen((prev) => !prev)}
                className={`p-2 rounded hover:bg-gray-100 transition ${
                  fixedOpen ? "text-blue-500" : "text-gray-400"
                }`}
                title={
                  fixedOpen ? "サイドバーを閉じる" : "サイドバーを固定表示"
                }
              >
                {sidebarIcon}
              </button>
              <div style={{ width: 32 }} />
            </div>

            {/* コンテンツ */}
            <div
              className="flex flex-col h-full justify-between"
              style={{
                paddingTop: SIDEBAR_PADDING,
                paddingBottom: SIDEBAR_PADDING,
              }}
            >
              <div className="overflow-y-auto flex-1">
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
                </ul>
              </div>
              {/* 下部スペースは背景と同色 */}
              <div className="h-[1px] bg-white" />
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
