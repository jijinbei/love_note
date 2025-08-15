import { useState, useEffect, useRef } from 'react';

const HOVER_TRIGGER_WIDTH = 24;

export const useSidebarState = () => {
  const [fixedOpen, setFixedOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const hoverAreaRef = useRef<HTMLDivElement>(null);

  // Hover detection when sidebar is not fixed
  useEffect(() => {
    if (fixedOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      setHovering(e.clientX < HOVER_TRIGGER_WIDTH);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [fixedOpen]);

  const isSidebarOpen = fixedOpen || hovering || sidebarHovered;

  return {
    fixedOpen,
    setFixedOpen,
    hovering,
    sidebarHovered,
    setSidebarHovered,
    isSidebarOpen,
    hoverAreaRef,
  };
};