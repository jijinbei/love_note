import React, { useEffect, useState } from 'react';
import { WorkspaceSelector } from './Sidebar/WorkspaceSelector';
import type { Workspace } from '../generated/graphql';
import RecentFiles from './RecentFiles';
import { useGraphQL } from '../hooks/useGraphQL';

type HomeProps = {
  workspaces: Workspace[];
  selectedWorkspace: string | null;
  isLoading: boolean;
  setSelectedWorkspace: (workspaceId: string | null) => void;
  handleCreateWorkspace: () => void;
  setCurrentView: (view: string) => void;
};

type Experiment = {
  id: string;
  title: string;
  updatedAt: string;
};

const Home: React.FC<HomeProps> = ({
  workspaces,
  selectedWorkspace,
  isLoading,
  setSelectedWorkspace,
  handleCreateWorkspace,
  setCurrentView,
}) => {
  const { loadWorkspaces, loadProjects, loadExperiments } = useGraphQL();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        setLoading(true);
        const workspaces = await loadWorkspaces();
        const allExperiments: Experiment[] = [];

        for (const workspace of workspaces) {
          const projects = await loadProjects(workspace.id);

          for (const project of projects) {
            const projectExperiments = await loadExperiments(project.id);
            allExperiments.push(...projectExperiments);
          }
        }

        const sortedExperiments = allExperiments.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        setExperiments(sortedExperiments);
      } catch (error) {
        console.error('Failed to fetch experiments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiments();
  }, []);

  // エクスペリメントクリック時の処理
  const handleExperimentClick = (experimentId: string) => {
    // エクスペリメントIDをセッションストレージに保存
    sessionStorage.setItem('selectedExperimentId', experimentId);
    // Markdown Editor画面に遷移
    setCurrentView('markdown');
  };

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

      {/* 最近使用したエクスペリメント */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <RecentFiles
          experiments={experiments}
          onExperimentClick={handleExperimentClick}
        />
      )}

      {/* ワークスペース選択UI */}
      <div className="w-[70%] mx-auto h-96">
        <WorkspaceSelector
          workspaces={workspaces}
          selectedWorkspace={selectedWorkspace}
          isLoading={isLoading}
          onWorkspaceChange={workspaceId =>
            setSelectedWorkspace(workspaceId || null)
          }
          onCreateWorkspace={handleCreateWorkspace}
        />
      </div>
    </div>
  );
};

export default Home;
