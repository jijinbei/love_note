import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  GetWorkspacesDocument,
  GetProjectsDocument,
  GetExperimentsDocument,
  CreateWorkspaceDocument,
  CreateProjectDocument,
  CreateExperimentDocument
} from '../generated/graphql';
import type { Workspace, Project, Experiment } from '../generated/graphql';
import { getQueryString, type GraphQLResponse } from '../utils/graphql';

export const useGraphQL = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load workspaces
  const loadWorkspaces = async (): Promise<Workspace[]> => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: getQueryString(GetWorkspacesDocument),
        variables: null
      });
      const data: GraphQLResponse<{workspaces: Workspace[]}> = JSON.parse(result);
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      return data.data?.workspaces || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workspaces';
      setError(errorMessage);
      console.error('Error loading workspaces:', err);
      throw err;
    }
  };

  // Load projects for a workspace
  const loadProjects = async (workspaceId: string): Promise<Project[]> => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: getQueryString(GetProjectsDocument),
        variables: { workspaceId }
      });
      const data: GraphQLResponse<{projects: Project[]}> = JSON.parse(result);
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      return data.data?.projects || [];
    } catch (err) {
      console.error('Error loading projects:', err);
      throw err;
    }
  };

  // Load experiments for a project
  const loadExperiments = async (projectId: string): Promise<Experiment[]> => {
    try {
      const result = await invoke<string>('graphql_query', {
        query: getQueryString(GetExperimentsDocument),
        variables: { projectId }
      });
      const data: GraphQLResponse<{experiments: Experiment[]}> = JSON.parse(result);
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      return data.data?.experiments || [];
    } catch (err) {
      console.error('Error loading experiments:', err);
      throw err;
    }
  };

  // Create workspace
  const createWorkspace = async (name: string, description?: string): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      const result = await invoke<string>('graphql_query', {
        query: getQueryString(CreateWorkspaceDocument),
        variables: {
          input: {
            name: name.trim(),
            description: description || null
          }
        }
      });
      const data: GraphQLResponse = JSON.parse(result);
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(errorMessage);
      console.error('Error creating workspace:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create project
  const createProject = async (workspaceId: string, name: string, description?: string): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      const result = await invoke<string>('graphql_query', {
        query: getQueryString(CreateProjectDocument),
        variables: {
          input: {
            workspaceId,
            name: name.trim(),
            description: description || null
          }
        }
      });
      const data: GraphQLResponse = JSON.parse(result);
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      console.error('Error creating project:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create experiment
  const createExperiment = async (projectId: string, title: string): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      const result = await invoke<string>('graphql_query', {
        query: getQueryString(CreateExperimentDocument),
        variables: {
          input: {
            projectId,
            title: title.trim()
          }
        }
      });
      const data: GraphQLResponse = JSON.parse(result);
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create experiment';
      setError(errorMessage);
      console.error('Error creating experiment:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    setError,
    loadWorkspaces,
    loadProjects,
    loadExperiments,
    createWorkspace,
    createProject,
    createExperiment,
  };
};