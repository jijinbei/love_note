import React, { useEffect, useState } from 'react';
import type { Workspace } from '../generated/graphql';
import RecentFiles from './RecentFiles';
import { WorkspaceManagement } from './WorkspaceManagement';
import { graphql } from '../generated/gql';
import { print } from 'graphql';
import { invoke } from '@tauri-apps/api/core';

// GraphQL queries using the graphql() function
const GetHomeWorkspacesQuery = graphql(`
  query GetHomeWorkspaces {
    workspaces {
      id
      name
      description
    }
  }
`);

const GetHomeProjectsQuery = graphql(`
  query GetHomeProjects($workspaceId: UUID!) {
    projects(workspaceId: $workspaceId) {
      id
      name
      workspaceId
    }
  }
`);

const GetHomeExperimentsQuery = graphql(`
  query GetHomeExperiments($projectId: UUID!) {
    experiments(projectId: $projectId) {
      id
      title
      projectId
      updatedAt
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

  // Load workspaces function
  const loadWorkspaces = async (): Promise<Workspace[]> => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: print(GetHomeWorkspacesQuery),
        variables: null,
      });
      const data = JSON.parse(result);

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      return data.data?.workspaces || [];
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      return [];
    }
  };

  // Load projects function
  const loadProjects = async (workspaceId: string) => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: print(GetHomeProjectsQuery),
        variables: { workspaceId },
      });
      const data = JSON.parse(result);

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      return data.data?.projects || [];
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  };

  // Load experiments function
  const loadExperiments = async (projectId: string) => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: print(GetHomeExperimentsQuery),
        variables: { projectId },
      });
      const data = JSON.parse(result);

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      return data.data?.experiments || [];
    } catch (error) {
      console.error('Failed to load experiments:', error);
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

  // Load workspaces on component mount (only once)
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoadingWorkspaces(true);
        const workspacesData = await loadWorkspaces();
        setWorkspaces(workspacesData);
        if (workspacesData.length > 0) {
          const firstWorkspaceId = workspacesData[0].id;
          setSelectedWorkspace(firstWorkspaceId);
          onWorkspaceChange(firstWorkspaceId);
        }
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      } finally {
        setIsLoadingWorkspaces(false);
      }
    };
    fetchWorkspaces();
  }, []); // Empty dependency array - only run once

  // Handle workspace creation
  const handleCreateWorkspace = async () => {
    const workspaceName = prompt('新しいワークスペース名を入力してください:');
    if (!workspaceName?.trim()) return;

    try {
      await createWorkspace(workspaceName);
      const workspacesData = await loadWorkspaces();
      setWorkspaces(workspacesData);

      // 新しく作成されたワークスペースを自動選択（最新のものを選択）
      const newWorkspace = workspacesData.find(ws => ws.name === workspaceName);
      if (newWorkspace) {
        setSelectedWorkspace(newWorkspace.id);
        onWorkspaceChange(newWorkspace.id);
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  // Load experiments when workspaces are available
  useEffect(() => {
    const fetchExperiments = async () => {
      if (workspaces.length === 0) return;

      try {
        setIsLoadingExperiments(true);
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
        setIsLoadingExperiments(false);
      }
    };

    fetchExperiments();
  }, [workspaces]); // Only depend on workspaces, not the functions

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
