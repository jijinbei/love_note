import React from 'react';
import type { Workspace } from '../../generated/graphql';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selectedWorkspace: string | null;
  isLoading: boolean;
  onWorkspaceChange: (workspaceId: string | null) => void;
  onCreateWorkspace: () => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspaces,
  selectedWorkspace,
  isLoading,
  onWorkspaceChange,
  onCreateWorkspace,
}) => {
  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-white mt-auto">
      <div className="mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Workspace
        </span>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={selectedWorkspace || ''}
          onChange={e => onWorkspaceChange(e.target.value || null)}
          className="flex-1 p-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        >
          <option value="">Select workspace...</option>
          {workspaces.map(workspace => (
            <option key={workspace.id} value={workspace.id}>
              📁 {workspace.name}
            </option>
          ))}
        </select>

        {/* 新しいワークスペース作成ボタン */}
        <button
          className="p-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          onClick={onCreateWorkspace}
          disabled={isLoading}
          title="新しいワークスペースを作成"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-600"></div>
          ) : (
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" />
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
