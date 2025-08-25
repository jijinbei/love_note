// GraphQL操作の共通クライアント

import { invoke } from '@tauri-apps/api/core';
import { print } from 'graphql';
import { graphql } from '../generated/gql';
import { GraphQLResponse, GraphQLError } from './types';

// GraphQL queries and mutations
export const GetBlocksQuery = graphql(`
  query GetBlocks($experimentId: UUID!) {
    blocks(experimentId: $experimentId) {
      id
      experimentId
      blockType
      content
      orderIndex
      createdAt
      updatedAt
    }
  }
`);

export const CreateBlockMutation = graphql(`
  mutation CreateBlock($input: CreateBlockInput!) {
    createBlock(input: $input) {
      id
      experimentId
      blockType
      content
      orderIndex
      createdAt
      updatedAt
    }
  }
`);

export const UpdateBlockMutation = graphql(`
  mutation UpdateBlock($id: UUID!, $input: UpdateBlockInput!) {
    updateBlock(id: $id, input: $input) {
      id
      experimentId
      blockType
      content
      orderIndex
      createdAt
      updatedAt
    }
  }
`);

export const DeleteBlockMutation = graphql(`
  mutation DeleteBlock($id: UUID!) {
    deleteBlock(id: $id)
  }
`);

/**
 * GraphQLクエリを実行する共通関数
 */
export async function executeGraphQL<T = any>(
  query: string,
  variables?: any
): Promise<T> {
  try {
    const result = await invoke<string>('graphql_query', {
      query,
      variables: variables || {},
    });

    const response: GraphQLResponse = JSON.parse(result);
    if (response.errors) {
      const error = new Error(response.errors[0].message) as GraphQLError;
      error.graphQLErrors = response.errors;
      throw error;
    }

    return response.data as T;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

/**
 * GraphQLクエリ（型安全版）
 */
export async function queryGraphQL<T = any>(
  queryDocument: any,
  variables?: any
): Promise<T> {
  return executeGraphQL(print(queryDocument), variables);
}

/**
 * GraphQLミューテーション（型安全版）
 */
export async function mutateGraphQL<T = any>(
  mutationDocument: any,
  variables?: any
): Promise<T> {
  return executeGraphQL(print(mutationDocument), variables);
}
