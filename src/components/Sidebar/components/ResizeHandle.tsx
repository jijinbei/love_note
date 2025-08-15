import React from 'react';

interface ResizeHandleProps {
  visible: boolean;
  onStartResize: () => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  visible,
  onStartResize,
}) => {
  if (!visible) return null;

  return (
    <div
      className="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-300 transition-colors z-50"
      onMouseDown={onStartResize}
      title="ドラッグしてサイドバーの幅を調整"
    />
  );
};
