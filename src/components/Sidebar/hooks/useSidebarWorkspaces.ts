import { useState, useEffect } from 'react';
import { graphql } from '../../../generated/gql';
import { print } from 'graphql';
import { invoke } from '@tauri-apps/api/core';
import type { Workspace } from '../../../generated/graphql';

// GraphQL queries using the graphql() function
const GetSidebarWorkspacesQuery = graphql(`
  query GetSidebarWorkspaces {
    workspaces {
      id
      name
      description
    }
  }
`);

export const useSidebarWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  );
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load workspaces
  const loadWorkspaces = async (): Promise<Workspace[]> => {
    setError('');

    try {
      const result = await invoke<string>('graphql_query', {
        query: print(GetSidebarWorkspacesQuery),
        variables: null,
      });
      const data = JSON.parse(result);

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      const workspacesData = data.data?.workspaces || [];
      setWorkspaces(workspacesData);
      return workspacesData;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to load workspaces:', error);
      return [];
    }
  };

  // Initial data loading
  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspace]);

  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      // 最低500msはローディング表示を維持（アニメーションを見せるため）
      await Promise.all([
        loadWorkspaces(),
        new Promise(resolve => setTimeout(resolve, 500)),
      ]);
    } finally {
      setRefreshLoading(false);
    }
  };

  return {
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
    error,
    setError,
    refreshLoading,
    handleRefresh,
  };
};
