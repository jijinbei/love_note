import React, { useEffect, useState } from 'react';
import type {
  Workspace,
  Project,
  Experiment as GeneratedExperiment,
} from '../generated/graphql';
import RecentFiles from './RecentFiles';
import { WorkspaceManagement } from './WorkspaceManagement';
import { graphql } from '../generated/gql';
import { print } from 'graphql';
import { invoke } from '@tauri-apps/api/core';

// GraphQL queries using the graphql() function - nested version for efficient fetching
const GetHomeWorkspacesWithDataQuery = graphql(`
  query GetHomeWorkspacesWithData {
    workspaces {
      id
      name
      description
      projects {
        id
        name
        workspaceId
        experiments {
          id
          title
          projectId
          updatedAt
        }
      }
    }
  }
`);

const CreateWorkspaceForHomeMutation = graphql(`
  mutation CreateWorkspaceForHome($input: CreateWorkspaceRequest!) {
    createWorkspace(input: $input) {
      id
      name
      description
    }
  }
`);

type HomeProps = {
  setCurrentView: (view: string) => void;
  onWorkspaceChange: (workspaceId: string | null) => void;
};

type Experiment = {
  id: string;
  title: string;
  updatedAt: string;
};

const Home: React.FC<HomeProps> = ({ setCurrentView, onWorkspaceChange }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  );
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(false);

  // Load workspaces with nested data function (all in one query)
  const loadWorkspacesWithData = async () => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: print(GetHomeWorkspacesWithDataQuery),
        variables: null,
      });
      const data = JSON.parse(result);

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      return data.data?.workspaces || [];
    } catch (error) {
      console.error('Failed to load workspaces with data:', error);
      return [];
    }
  };

  // Create workspace function
  const createWorkspace = async (name: string): Promise<void> => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: print(CreateWorkspaceForHomeMutation),
        variables: {
          input: {
            name,
            description: null,
          },
        },
      });
      const data = JSON.parse(result);

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  // Load workspaces with all nested data on component mount (only once)
  useEffect(() => {
    const fetchWorkspacesAndExperiments = async () => {
      try {
        setIsLoadingWorkspaces(true);
        setIsLoadingExperiments(true);

        const workspacesWithData = await loadWorkspacesWithData();
        setWorkspaces(workspacesWithData);

        if (workspacesWithData.length > 0) {
          const firstWorkspaceId = workspacesWithData[0].id;
          setSelectedWorkspace(firstWorkspaceId);
          onWorkspaceChange(firstWorkspaceId);
        }

        // Extract all experiments from nested data and sort by updatedAt
        const allExperiments: Experiment[] = [];
        workspacesWithData.forEach((workspace: Workspace) => {
          workspace.projects.forEach((project: Project) => {
            allExperiments.push(...project.experiments);
          });
        });

        const sortedExperiments = allExperiments.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        setExperiments(sortedExperiments);
      } catch (error) {
        console.error('Failed to load workspaces and experiments:', error);
      } finally {
        setIsLoadingWorkspaces(false);
        setIsLoadingExperiments(false);
      }
    };
    fetchWorkspacesAndExperiments();
  }, []); // Empty dependency array - only run once

  // Handle workspace creation
  const handleCreateWorkspace = async () => {
    const workspaceName = prompt('新しいワークスペース名を入力してください:');
    if (!workspaceName?.trim()) return;

    try {
      await createWorkspace(workspaceName);

      // Reload all data after creating workspace
      const workspacesWithData = await loadWorkspacesWithData();
      setWorkspaces(workspacesWithData);

      // 新しく作成されたワークスペースを自動選択（最新のものを選択）
      const newWorkspace = workspacesWithData.find(
        (ws: Workspace) => ws.name === workspaceName
      );
      if (newWorkspace) {
        setSelectedWorkspace(newWorkspace.id);
        onWorkspaceChange(newWorkspace.id);
      }

      // Update experiments as well
      const allExperiments: Experiment[] = [];
      workspacesWithData.forEach((workspace: Workspace) => {
        workspace.projects.forEach((project: Project) => {
          allExperiments.push(...project.experiments);
        });
      });

      const sortedExperiments = allExperiments.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setExperiments(sortedExperiments);
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

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
      <p>Electronic Lab Notebook</p>

      {/* 最近使用したエクスペリメント */}
      {isLoadingWorkspaces ? (
        <div className="text-center py-8">
          <p>Loading workspaces...</p>
        </div>
      ) : isLoadingExperiments ? (
        <div className="text-center py-8">
          <p>Loading recent experiments...</p>
        </div>
      ) : (
        <RecentFiles
          experiments={experiments}
          onExperimentClick={handleExperimentClick}
        />
      )}

      {/* ワークスペース選択UI */}
      <WorkspaceManagement
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        isLoadingWorkspaces={isLoadingWorkspaces}
        onWorkspaceChange={workspaceId => {
          setSelectedWorkspace(workspaceId || null);
          onWorkspaceChange(workspaceId || null);
        }}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </div>
  );
};

export default Home;
