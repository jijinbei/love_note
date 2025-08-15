import React, { useEffect, useState } from 'react';
import { ProjectItem } from './ProjectItem';
import { graphql } from '../../../generated/gql';
import { print } from 'graphql';
import { invoke } from '@tauri-apps/api/core';
import type { Project, Experiment } from '../../../generated/graphql';

// GraphQL queries using the graphql() function
const GetWorkspaceProjectsQuery = graphql(`
  query GetWorkspaceProjects($workspaceId: UUID!) {
    projects(workspaceId: $workspaceId) {
      id
      name
      workspaceId
    }
  }
`);

const GetProjectExperimentsQuery = graphql(`
  query GetProjectExperiments($projectId: UUID!) {
    experiments(projectId: $projectId) {
      id
      title
      projectId
    }
  }
`);

const CreateWorkspaceProjectMutation = graphql(`
  mutation CreateWorkspaceProject($input: CreateProjectRequest!) {
    createProject(input: $input) {
      id
      name
      workspaceId
    }
  }
`);

const CreateProjectExperimentMutation = graphql(`
  mutation CreateProjectExperiment($input: CreateExperimentRequest!) {
    createExperiment(input: $input) {
      id
      title
      projectId
    }
  }
`);

interface WorkspaceContentItemProps {
  workspaceId: string;
  onExperimentClick?: (experimentId: string) => void; // 新しく追加
}

export const WorkspaceContentItem: React.FC<WorkspaceContentItemProps> = ({
  workspaceId,
  onExperimentClick, // 新しく追加
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectExperiments, setProjectExperiments] = useState<
    Record<string, Experiment[]>
  >({});
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load projects function
  const loadProjects = async (workspaceId: string): Promise<Project[]> => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: print(GetWorkspaceProjectsQuery),
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
  const loadExperiments = async (projectId: string): Promise<Experiment[]> => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: print(GetProjectExperimentsQuery),
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

  // Create project function
  const createProject = async (workspaceId: string, name: string): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await invoke<string>('graphql_query', {
        query: print(CreateWorkspaceProjectMutation),
        variables: {
          input: {
            name,
            description: null,
            workspaceId,
          },
        },
      });
      const data = JSON.parse(result);

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create experiment function
  const createExperiment = async (projectId: string, title: string): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await invoke<string>('graphql_query', {
        query: print(CreateProjectExperimentMutation),
        variables: {
          input: {
            title,
            projectId,
          },
        },
      });
      const data = JSON.parse(result);

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
    } catch (error) {
      console.error('Error creating experiment:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // プロジェクトを自動ロード
  useEffect(() => {
    const loadData = async () => {
      try {
        const projectsData = await loadProjects(workspaceId);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };
    loadData();
  }, [workspaceId, loadProjects]);

  // プロジェクトの展開/折りたたみ
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (expandedProjects.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
      // Load experiments if not already loaded
      if (!projectExperiments[projectId]) {
        loadExperiments(projectId)
          .then(experiments => {
            setProjectExperiments(prev => ({
              ...prev,
              [projectId]: experiments,
            }));
          })
          .catch(console.error);
      }
    }
    setExpandedProjects(newExpanded);
  };

  // プロジェクト作成
  const handleCreateProject = async () => {
    const projectName = prompt('新しいプロジェクト名を入力してください:');
    if (!projectName?.trim()) return;

    try {
      await createProject(workspaceId, projectName);
      // Reload projects
      const projectsData = await loadProjects(workspaceId);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  // 実験作成
  const handleCreateExperiment = async (projectId: string) => {
    const experimentTitle = prompt('新しい実験タイトルを入力してください:');
    if (!experimentTitle?.trim()) return;

    try {
      await createExperiment(projectId, experimentTitle);
      // Reload experiments for this project
      const experiments = await loadExperiments(projectId);
      setProjectExperiments(prev => ({
        ...prev,
        [projectId]: experiments,
      }));
    } catch (error) {
      console.error('Error creating experiment:', error);
    }
  };

  return (
    <>
      {/* プロジェクト作成ボタン */}
      <li className="mb-3">
        <button
          className="w-full p-2 text-sm text-left text-gray-600 border border-dashed border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreateProject}
          disabled={isLoading}
          title="新しいプロジェクトを作成"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 mr-2"></div>
              Creating project...
            </div>
          ) : (
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Project
            </div>
          )}
        </button>
      </li>

      {/* プロジェクト一覧 */}
      {projects.map(project => (
        <ProjectItem
          key={project.id}
          project={project}
          experiments={projectExperiments[project.id] || []}
          isExpanded={expandedProjects.has(project.id)}
          isLoading={isLoading}
          onToggle={toggleProject}
          onCreateExperiment={handleCreateExperiment}
          onExperimentClick={onExperimentClick} // コールバックを渡す
        />
      ))}

      {/* プロジェクトが存在しない場合 */}
      {projects.length === 0 && !isLoading && (
        <li className="text-gray-500 text-xs italic p-2 text-center">
          No projects found. Create your first project!
        </li>
      )}
    </>
  );
};
