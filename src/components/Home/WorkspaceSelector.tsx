import React from 'react';
import type { Workspace } from '../../generated/graphql';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selectedWorkspace: string | null;
  isLoading: boolean;
  onWorkspaceChange: (workspaceId: string | null) => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspaces,
  selectedWorkspace,
  isLoading,
  onWorkspaceChange,
}) => {
  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-white mt-auto">
      <div className="mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Workspace
        </span>
      </div>
      <select
        value={selectedWorkspace || ''}
        onChange={e => onWorkspaceChange(e.target.value || null)}
        className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isLoading}
      >
        <option value="">Select workspace...</option>
        {workspaces.map(workspace => (
          <option key={workspace.id} value={workspace.id}>
            📁 {workspace.name}
          </option>
        ))}
      </select>
    </div>
  );
};
