import React from 'react';

interface SidebarHeaderProps {
  fixedOpen: boolean;
  onToggleFixed: () => void;
}


const SidebarIcon: React.FC = () => (
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

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  fixedOpen,
  onToggleFixed,
}) => {
  return (
    <div className="flex items-center px-6 py-4 border-b border-gray-100">
      <span className="font-bold text-lg">Menu</span>
      <div className="flex-1" />

      {/* 固定表示切り替えボタン */}
      <button
        onClick={onToggleFixed}
        className={`p-1.5 rounded hover:bg-gray-100 transition ml-2 ${fixedOpen ? 'text-blue-500' : 'text-gray-400'
          }`}
        title={fixedOpen ? 'サイドバーを閉じる' : 'サイドバーを固定表示'}
      >
        <SidebarIcon />
      </button>
    </div>
  );
};