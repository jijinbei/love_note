import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  GetUsersDocument,
  GetBlocksDocument,
  CreateUserDocument,
  CreateBlockDocument
} from '../../generated/graphql';
import type { 
  User, 
  Workspace, 
  Project,
  Experiment,
  Block
} from '../../generated/graphql';
import { getQueryString } from '../../utils/graphql';
import type { GraphQLResponse } from '../../utils/graphql';
import { FormType } from '../../utils/constants';
import { useGraphQL } from '../../hooks/useGraphQL';

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
}


// フォームフィールド定義
const getFormFields = (type: FormType): FormField[] => {
  switch (type) {
    case 'user':
      return [
        { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'Enter username' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email' },
        { name: 'displayName', label: 'Display Name', type: 'text', required: false, placeholder: 'Enter display name (optional)' },
      ];
    case 'workspace':
      return [
        { name: 'name', label: 'Workspace Name', type: 'text', required: true, placeholder: 'Enter workspace name' },
        { name: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Enter description (optional)' },
      ];
    case 'project':
      return [
        { name: 'workspaceId', label: 'Workspace', type: 'select-workspace', required: true, placeholder: 'Select a workspace' },
        { name: 'name', label: 'Project Name', type: 'text', required: true, placeholder: 'Enter project name' },
        { name: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Enter description (optional)' },
      ];
    case 'experiment':
      return [
        { name: 'projectId', label: 'Project', type: 'select-project', required: true, placeholder: 'Select a project' },
        { name: 'title', label: 'Experiment Title', type: 'text', required: true, placeholder: 'Enter experiment title' },
      ];
    case 'block':
      return [
        { name: 'experimentId', label: 'Experiment', type: 'select-experiment', required: true, placeholder: 'Select an experiment' },
        { name: 'blockType', label: 'Block Type', type: 'text', required: true, placeholder: 'text, image, code, etc.' },
        { name: 'content', label: 'Content', type: 'textarea', required: true, placeholder: 'Enter block content' },
        { name: 'orderIndex', label: 'Order Index', type: 'number', required: true, placeholder: '0, 1, 2...' },
      ];
    default:
      return [];
  }
};

export function GraphQLTest() {
  const [activeTab, setActiveTab] = useState<'query' | 'create' | 'image'>('query');
  const [selectedCreateType, setSelectedCreateType] = useState<FormType>('user');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  
  // Use shared GraphQL hook
  const { 
    isLoading, 
    error, 
    setError, 
    loadWorkspaces, 
    loadProjects, 
    loadExperiments, 
    createWorkspace, 
    createProject, 
    createExperiment 
  } = useGraphQL();
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceProjects, setWorkspaceProjects] = useState<Record<string, Project[]>>({});
  const [projectExperiments, setProjectExperiments] = useState<Record<string, Experiment[]>>({});
  const [experimentBlocks, setExperimentBlocks] = useState<Record<string, Block[]>>({});
  
  // Flattened data for select options
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allExperiments, setAllExperiments] = useState<Experiment[]>([]);
  
  // Expansion states
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedExperiments, setExpandedExperiments] = useState<Set<string>>(new Set());

  // フォームデータの初期化
  useEffect(() => {
    const fields = getFormFields(selectedCreateType);
    const initialData: Record<string, string> = {};
    fields.forEach(field => {
      initialData[field.name] = '';
    });
    setFormData(initialData);
  }, [selectedCreateType]);

  // 初期データ読み込み
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setError('');
    try {
      // Load users and workspaces in parallel
      const [usersResult, workspacesData] = await Promise.all([
        invoke<string>('graphql_query', { query: getQueryString(GetUsersDocument), variables: null }),
        loadWorkspaces()
      ]);

      const usersData: GraphQLResponse<{users: User[]}> = JSON.parse(usersResult);

      if (usersData.errors) {
        throw new Error(usersData.errors[0]?.message);
      }

      setUsers(usersData.data?.users || []);
      setWorkspaces(workspacesData);
      
      // Clear all cached data to force refresh
      setWorkspaceProjects({});
      setProjectExperiments({});
      setExperimentBlocks({});
      
      // Load all projects and experiments for select options
      await loadAllProjectsAndExperiments(workspacesData);
      
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  // Load all projects and experiments for select dropdowns
  const loadAllProjectsAndExperiments = async (workspaceList: Workspace[]) => {
    try {
      const projects: Project[] = [];
      const experiments: Experiment[] = [];

      for (const workspace of workspaceList) {
        const projectsData = await loadProjects(workspace.id);
        projects.push(...projectsData);
        
        for (const project of projectsData) {
          const experimentsData = await loadExperiments(project.id);
          experiments.push(...experimentsData);
        }
      }

      setAllProjects(projects);
      setAllExperiments(experiments);
    } catch (error) {
      console.error('Failed to load all projects and experiments:', error);
    }
  };

  // Projects を取得する関数
  const useProjects = (workspaceId: string, enabled: boolean) => {
    useEffect(() => {
      if (enabled) {
        loadProjectsForCache(workspaceId); // 初回はキャッシュを使用
      }
    }, [workspaceId, enabled]);

    return {
      data: workspaceProjects[workspaceId] || [],
      isLoading: false // 簡略化
    };
  };

  // Experiments を取得する関数
  const useExperiments = (projectId: string, enabled: boolean) => {
    useEffect(() => {
      if (enabled) {
        loadExperimentsForCache(projectId); // 初回はキャッシュを使用
      }
    }, [projectId, enabled]);

    return {
      data: projectExperiments[projectId] || [],
      isLoading: false // 簡略化
    };
  };

  // Blocks を取得する関数
  const useBlocks = (experimentId: string, enabled: boolean) => {
    useEffect(() => {
      if (enabled) {
        loadBlocksForCache(experimentId); // 初回はキャッシュを使用
      }
    }, [experimentId, enabled]);

    return {
      data: experimentBlocks[experimentId] || [],
      isLoading: false // 簡略化
    };
  };

  const loadProjectsForCache = async (workspaceId: string) => {
    try {
      if (!workspaceProjects[workspaceId]) {
        const projectsData = await loadProjects(workspaceId);
        setWorkspaceProjects(prev => ({
          ...prev,
          [workspaceId]: projectsData
        }));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadExperimentsForCache = async (projectId: string) => {
    try {
      if (!projectExperiments[projectId]) {
        const experimentsData = await loadExperiments(projectId);
        setProjectExperiments(prev => ({
          ...prev,
          [projectId]: experimentsData
        }));
      }
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  };

  const loadBlocksForCache = async (experimentId: string) => {
    try {
      if (!experimentBlocks[experimentId]) {
        const result = await invoke<string>('graphql_query', {
          query: getQueryString(GetBlocksDocument),
          variables: { experimentId }
        });
        const blocksData: GraphQLResponse<{blocks: Block[]}> = JSON.parse(result);
        if (!blocksData.errors) {
          setExperimentBlocks(prev => ({
            ...prev,
            [experimentId]: blocksData.data?.blocks || []
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load blocks:', error);
    }
  };

  // フォーム送信
  const handleCreateData = async () => {
    setIsCreating(true);
    setError('');
    
    try {
      const input: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value.trim()) {
          if (key === 'orderIndex') {
            input[key] = parseInt(value);
          } else {
            input[key] = value;
          }
        }
      });

      switch (selectedCreateType) {
        case 'user':
          // User creation uses direct invoke as it's not in useGraphQL hook
          const userResult = await invoke<string>('graphql_query', {
            query: getQueryString(CreateUserDocument),
            variables: { input }
          });
          const userResponse: GraphQLResponse = JSON.parse(userResult);
          if (userResponse.errors) {
            throw new Error(userResponse.errors[0].message);
          }
          break;
        case 'workspace':
          await createWorkspace(input.name, input.description);
          break;
        case 'project':
          await createProject(input.workspaceId, input.name, input.description);
          break;
        case 'experiment':
          await createExperiment(input.projectId, input.title);
          break;
        case 'block':
          // Block creation uses direct invoke as it's not in useGraphQL hook
          if (input.content && typeof input.content === 'string') {
            if (input.blockType === 'text') {
              input.content = JSON.stringify({
                type: 'NoteBlock',
                text: input.content
              });
            } else {
              input.content = JSON.stringify({
                type: 'NoteBlock',
                text: input.content
              });
            }
          }
          const blockResult = await invoke<string>('graphql_query', {
            query: getQueryString(CreateBlockDocument),
            variables: { input }
          });
          const blockResponse: GraphQLResponse = JSON.parse(blockResult);
          if (blockResponse.errors) {
            throw new Error(blockResponse.errors[0].message);
          }
          break;
        default:
          throw new Error(`Unknown create type: ${selectedCreateType}`);
      }

      // フォームをリセット
      const fields = getFormFields(selectedCreateType);
      const resetData: Record<string, string> = {};
      fields.forEach(field => {
        resetData[field.name] = '';
      });
      setFormData(resetData);

      // データを再読み込み（キャッシュクリア含む）
      await loadInitialData();
      
      // 作成成功メッセージを表示
      console.log(`${selectedCreateType} created successfully and data refreshed`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create data');
      console.error('Error creating data:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // フォーム入力ハンドラー
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // WorkspaceItem コンポーネント
  const WorkspaceItem = ({ workspace }: { workspace: Workspace }) => {
    const isExpanded = expandedWorkspaces.has(workspace.id);
    const { data: projects, isLoading: projectsLoading } = useProjects(workspace.id, isExpanded);

    return (
      <div key={workspace.id} className="mb-2">
        <div className="my-1.5 p-2 bg-white rounded border border-gray-300 text-xs font-mono hover:bg-gray-100">
          <div 
            onClick={() => toggleWorkspace(workspace.id)}
            className="flex items-center mb-1 cursor-pointer"
          >
            <span className="mr-2 text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
            <strong>📁 {workspace.name}</strong>
            {projectsLoading && <span className="ml-2 text-gray-600">⏳</span>}
          </div>
          <div className="text-[10px] text-gray-500 break-all font-mono ml-4 select-text cursor-text">{workspace.id}</div>
        </div>
        
        {/* プロジェクト表示 */}
        {isExpanded && (
          <div className="ml-5 mt-1.5">
            {projects.map(project => (
              <ProjectItem key={project.id} project={project} />
            ))}
            {projects.length === 0 && (
              <div className="text-gray-500 text-xs italic p-2">No projects in this workspace</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ProjectItem コンポーネント
  const ProjectItem = ({ project }: { project: Project }) => {
    const isExpanded = expandedProjects.has(project.id);
    const { data: experiments, isLoading: experimentsLoading } = useExperiments(project.id, isExpanded);

    return (
      <div className="mb-1.5">
        <div className="p-1.5 bg-blue-50 rounded border border-blue-200 text-xs font-mono hover:bg-blue-100">
          <div 
            onClick={() => toggleProject(project.id)}
            className="flex items-center mb-1 cursor-pointer"
          >
            <span className="mr-1.5 text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
            📋 <strong>{project.name}</strong>
            {experimentsLoading && <span className="ml-1.5 text-gray-600">⏳</span>}
          </div>
          <div className="text-[10px] text-gray-500 break-all font-mono ml-4 select-text cursor-text">{project.id}</div>
        </div>
        
        {/* 実験表示 */}
        {isExpanded && (
          <div className="ml-5 mt-1">
            {experiments.map(experiment => (
              <ExperimentItem key={experiment.id} experiment={experiment} />
            ))}
            {experiments.length === 0 && (
              <div className="text-gray-500 text-xs italic p-1">No experiments in this project</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ExperimentItem コンポーネント
  const ExperimentItem = ({ experiment }: { experiment: Experiment }) => {
    const isExpanded = expandedExperiments.has(experiment.id);
    const { data: blocks, isLoading: blocksLoading } = useBlocks(experiment.id, isExpanded);

    return (
      <div className="mb-1">
        <div className="p-1 bg-yellow-50 rounded border border-yellow-200 text-xs font-mono hover:bg-yellow-100">
          <div 
            onClick={() => toggleExperiment(experiment.id)}
            className="flex items-center mb-1 cursor-pointer"
          >
            <span className="mr-1 text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
            🧪 <strong>{experiment.title}</strong>
            {blocksLoading && <span className="ml-1 text-gray-600">⏳</span>}
          </div>
          <div className="text-[10px] text-gray-500 break-all font-mono ml-3 select-text cursor-text">{experiment.id}</div>
        </div>
        
        {/* ブロック表示 */}
        {isExpanded && (
          <div className="ml-5 mt-0.5">
            {blocks.map(block => (
              <div key={block.id} className="p-1 bg-red-50 rounded text-xs font-mono mb-0.5 border border-red-200">
                <div>🧱 <strong>{block.blockType}</strong>: {block.content.substring(0, 30)}...</div>
                <div className="text-[10px] text-gray-500 mt-1 break-all font-mono">{block.id}</div>
              </div>
            ))}
            {blocks.length === 0 && (
              <div className="text-gray-500 text-xs italic p-1">No blocks in this experiment</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 展開/折りたたみハンドラー
  const toggleWorkspace = (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces);
    if (expandedWorkspaces.has(workspaceId)) {
      newExpanded.delete(workspaceId);
    } else {
      newExpanded.add(workspaceId);
    }
    setExpandedWorkspaces(newExpanded);
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (expandedProjects.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleExperiment = (experimentId: string) => {
    const newExpanded = new Set(expandedExperiments);
    if (expandedExperiments.has(experimentId)) {
      newExpanded.delete(experimentId);
    } else {
      newExpanded.add(experimentId);
    }
    setExpandedExperiments(newExpanded);
  };

  return (
    <div className="p-5 font-sans max-w-6xl mx-auto bg-white min-h-screen text-gray-800">
      <h1 className="text-gray-800 mb-2.5 text-2xl font-bold">🚀 GraphQL + TypeScript Interface</h1>
      <p className="text-gray-600 mb-8">
        Type-safe GraphQL operations with hierarchical data exploration and automatic form generation.
      </p>

      {/* タブ切り替え */}
      <div className="mb-8 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('query')}
          className={`px-5 py-2.5 border-none cursor-pointer rounded-t-lg mr-2.5 font-bold transition-all ${
            activeTab === 'query' 
              ? 'bg-blue-500 text-white' 
              : 'bg-transparent text-gray-600 hover:bg-gray-100'
          }`}
        >
          📊 View Data
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-5 py-2.5 border-none cursor-pointer rounded-t-lg font-bold transition-all ${
            activeTab === 'create' 
              ? 'bg-green-500 text-white' 
              : 'bg-transparent text-gray-600 hover:bg-gray-100'
          }`}
        >
          ➕ Create Data
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="mb-10 p-5 bg-gray-50 rounded-lg">
          <h3 className="text-gray-800 mb-5 text-lg font-semibold">➕ Create New Data</h3>
          
          <div className="mb-5">
            <label className="block mb-2 font-bold text-gray-800">
              Select Data Type:
            </label>
            <select
              value={selectedCreateType}
              onChange={(e) => setSelectedCreateType(e.target.value as FormType)}
              className="w-full p-2.5 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">👤 User</option>
              <option value="workspace">📁 Workspace</option>
              <option value="project">📋 Project</option>
              <option value="experiment">🧪 Experiment</option>
              <option value="block">🧱 Block</option>
            </select>
          </div>

          {/* 自動生成フォーム */}
          {getFormFields(selectedCreateType).map((field) => (
            <div key={field.name} className="mb-5">
              <label className="block mb-2 font-bold text-gray-800">
                {field.label} {field.required && <span className="text-red-600">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full p-2.5 border-2 border-gray-300 rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : field.type === 'select-workspace' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full p-2.5 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{field.placeholder}</option>
                  {workspaces.map(workspace => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              ) : field.type === 'select-project' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full p-2.5 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{field.placeholder}</option>
                  {allProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : field.type === 'select-experiment' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full p-2.5 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{field.placeholder}</option>
                  {allExperiments.map(experiment => (
                    <option key={experiment.id} value={experiment.id}>
                      {experiment.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'uuid' ? 'text' : field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full p-2.5 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    field.type === 'uuid' ? 'font-mono' : ''
                  }`}
                />
              )}
            </div>
          ))}

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              ❌ {error}
            </div>
          )}

          <button
            onClick={handleCreateData}
            disabled={isCreating}
            className={`w-full p-3 bg-gradient-to-r from-green-500 to-teal-500 text-white border-none rounded-md text-base font-bold cursor-pointer transition-all ${
              isCreating ? 'opacity-60 cursor-not-allowed' : 'opacity-100 hover:from-green-600 hover:to-teal-600'
            }`}
          >
            {isCreating ? '⏳ Creating...' : '✨ Create'}
          </button>
        </div>
      )}

      {activeTab === 'query' && (
        /* データ表示セクション */
        <div className="p-5 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-gray-800 text-lg font-semibold">📚 Live Data Explorer</h3>
            <button
              onClick={loadInitialData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-60 transition-all"
            >
              {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
          
          {isLoading && (
            <div className="text-gray-600 italic mb-5 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Loading data...
            </div>
          )}

          {error && (
            <div className="text-red-600 mb-5 p-3 bg-red-50 border border-red-200 rounded-md">
              ❌ Error: {error}
            </div>
          )}
          
          {workspaces.length > 0 ? (
            <div className="mb-5">
              <h4 className="text-green-600 mb-2.5 font-semibold">📁 Workspaces ({workspaces.length}):</h4>
              {workspaces.map(workspace => (
                <WorkspaceItem key={workspace.id} workspace={workspace} />
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="text-gray-600 italic p-4 text-center bg-white rounded-md border-2 border-dashed border-gray-300 mb-5">
                No workspaces found. Create a workspace to get started.
              </div>
            )
          )}

          {users.length > 0 && (
            <div>
              <h4 className="text-pink-600 font-semibold mb-2.5">👥 Users ({users.length}):</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {users.map(user => (
                  <div key={user.id} className="p-2 bg-white rounded border border-gray-300 text-xs">
                    <div className="font-bold">{user.username}</div>
                    <div className="text-gray-600">{user.email}</div>
                    {user.displayName && <div className="text-gray-500">{user.displayName}</div>}
                    <div className="text-gray-400 font-mono text-[10px] mt-1 break-all">{user.id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}