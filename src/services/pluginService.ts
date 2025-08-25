// Plugin Service - GraphQL経由でプラグイン情報をDB操作
import { executeGraphQL } from './graphqlClient';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  sourceCode: string;
  isEnabled: boolean;
  installedAt: string;
  updatedAt: string;
}

export interface InstallPluginInput {
  name: string;
  version: string;
  description?: string;
  author?: string;
  sourceCode: string;
}

/**
 * インストール済みプラグイン一覧を取得
 */
export async function getInstalledPlugins(): Promise<Plugin[]> {
  const query = `
    query GetPlugins {
      plugins {
        id
        name
        version
        description
        author
        sourceCode
        isEnabled
        installedAt
        updatedAt
      }
    }
  `;

  const result = await executeGraphQL<{ plugins: Plugin[] }>(query);
  return result.plugins;
}

/**
 * プラグインをインストール（DB保存）
 */
export async function installPlugin(
  input: InstallPluginInput
): Promise<Plugin> {
  const mutation = `
    mutation InstallPlugin($input: InstallPluginInput!) {
      installPlugin(input: $input) {
        id
        name
        version
        description
        author
        sourceCode
        isEnabled
        installedAt
        updatedAt
      }
    }
  `;

  const result = await executeGraphQL<{ installPlugin: Plugin }>(mutation, {
    input,
  });

  return result.installPlugin;
}

/**
 * プラグインをアンインストール（DB削除）
 */
export async function uninstallPlugin(id: string): Promise<boolean> {
  const mutation = `
    mutation UninstallPlugin($id: UUID!) {
      uninstallPlugin(id: $id)
    }
  `;

  const result = await executeGraphQL<{ uninstallPlugin: boolean }>(mutation, {
    id,
  });

  return result.uninstallPlugin;
}

/**
 * プラグインを有効化
 */
export async function enablePlugin(id: string): Promise<Plugin | null> {
  const mutation = `
    mutation EnablePlugin($id: UUID!) {
      enablePlugin(id: $id) {
        id
        name
        version
        description
        author
        sourceCode
        isEnabled
        installedAt
        updatedAt
      }
    }
  `;

  const result = await executeGraphQL<{ enablePlugin: Plugin | null }>(
    mutation,
    {
      id,
    }
  );

  return result.enablePlugin;
}

/**
 * プラグインを無効化
 */
export async function disablePlugin(id: string): Promise<Plugin | null> {
  const mutation = `
    mutation DisablePlugin($id: UUID!) {
      disablePlugin(id: $id) {
        id
        name
        version
        description
        author
        sourceCode
        isEnabled
        installedAt
        updatedAt
      }
    }
  `;

  const result = await executeGraphQL<{ disablePlugin: Plugin | null }>(
    mutation,
    {
      id,
    }
  );

  return result.disablePlugin;
}
