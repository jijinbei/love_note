import React, { useState } from 'react';

export type HoverSidebarItem = {
  icon: React.ReactNode; // アイコン
  label: string; // ラベル（ホバー時に表示）
  onClick: () => void; // クリック時の動作
};

type HoverSidebarProps = {
  items: HoverSidebarItem[];
};

const HoverSidebar: React.FC<HoverSidebarProps> = ({ items }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null); // ホバー中のアイテムを管理

  return (
    <div className="max-h-32 overflow-visible bg-gray-50 p-3 rounded-lg border border-gray-200">
      <div className="flex gap-1">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative group"
            onMouseEnter={() => setHoveredIndex(index)} // ホバー開始
            onMouseLeave={() => setHoveredIndex(null)} // ホバー終了
          >
            {/* アイコンボタン */}
            <button
              onClick={item.onClick}
              className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
            >
              <span className="text-sm">{item.icon}</span>
            </button>

            {/* ホバー時に表示されるラベル */}
            {hoveredIndex === index && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
                {item.label}
                {/* 矢印 */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoverSidebar;
