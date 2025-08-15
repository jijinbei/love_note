import React from 'react';
import { WorkspaceSelector } from './Sidebar/components/WorkspaceSelector';
import type { Workspace } from '../generated/graphql';

interface WorkspaceManagementProps {
  workspaces: Workspace[];
  selectedWorkspace: string | null;
  isLoadingWorkspaces: boolean;
  onWorkspaceChange: (workspaceId: string | null) => void;
  onCreateWorkspace: () => void;
}

const CreateWorkspaceIcon: React.FC = () => (
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
);

export const WorkspaceManagement: React.FC<WorkspaceManagementProps> = ({
  workspaces,
  selectedWorkspace,
  isLoadingWorkspaces,
  onWorkspaceChange,
  onCreateWorkspace,
}) => {
  return (
    <div className="w-[70%] mx-auto mt-8">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Workspace Selection
          </h3>
          <p className="text-sm text-gray-600">
            選択したワークスペースのプロジェクトとエクスペリメントがサイドバーに表示されます
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <WorkspaceSelector
              workspaces={workspaces}
              selectedWorkspace={selectedWorkspace}
              isLoading={isLoadingWorkspaces}
              onWorkspaceChange={onWorkspaceChange}
            />
          </div>

          {/* 新しいワークスペース作成ボタン */}
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={onCreateWorkspace}
            disabled={isLoadingWorkspaces}
            title="新しいワークスペースを作成"
          >
            <CreateWorkspaceIcon />
            New Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
