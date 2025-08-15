export const SIDEBAR_STYLES = {
  // Sidebar positioning and display
  container: 'h-screen flex',
  sidebar:
    'fixed top-0 left-0 h-screen z-40 bg-white text-gray-600 shadow-lg border-r border-gray-200 overflow-hidden flex flex-col',

  // Hover area
  hoverArea: 'fixed top-0 left-0 h-full w-2 z-50',

  // Main content
  mainContent: 'flex-1 p-4 overflow-auto',
  mainContentAnimated: 'flex-1 p-4 overflow-auto transition-all duration-300',
  mainContentInner: 'w-full',
} as const;

export const ANIMATION_CONFIG = {
  duration: 0.3,
  type: 'tween' as const,
  variants: {
    open: { width: 'var(--sidebar-width)', opacity: 1 },
    closed: { width: 0, opacity: 0 },
  },
} as const;
