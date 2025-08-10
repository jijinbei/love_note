import React from "react";
import { WorkspaceSelector } from "./Sidebar/WorkspaceSelector";
import type { Workspace } from "../generated/graphql";

type HomeProps = {
  workspaces: Workspace[]; // 正しい型を指定
  selectedWorkspace: string | null;
  isLoading: boolean;
  setSelectedWorkspace: (workspaceId: string | null) => void;
  handleCreateWorkspace: () => void;
};

const Home: React.FC<HomeProps> = ({
  workspaces,
  selectedWorkspace,
  isLoading,
  setSelectedWorkspace,
  handleCreateWorkspace,
}) => {
  return (
    <div className="text-center">
      <img
        className="mx-auto w-1/3 rounded-full"
        src="../../src-tauri/icons/love_note.png"
        alt="Love Note Logo"
      />
      <h1 className="text-2xl font-bold mb-4">Love Note</h1>
      <p>Electronic Lab Notebook with Tauri + React + SQLite</p>
      <p>Switch to GraphQL Test to verify database operations.</p>

      {/* ワークスペース選択UI */}
      <WorkspaceSelector
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        isLoading={isLoading}
        onWorkspaceChange={(workspaceId) => setSelectedWorkspace(workspaceId || null)} // 型を一致させる
        onCreateWorkspace={handleCreateWorkspace}
      />
    </div>
  );
};

export default Home;