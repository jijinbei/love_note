import React, { useEffect, useState } from 'react';
import { ProjectItem } from './ProjectItem';
import { useGraphQL } from '../../hooks/useGraphQL';
import type { Project, Experiment } from '../../generated/graphql';

interface WorkspaceContentItemProps {
  workspaceId: string;
  onExperimentClick?: (experimentId: string) => void; // 新しく追加
}

export const WorkspaceContentItem: React.FC<WorkspaceContentItemProps> = ({
  workspaceId,
  onExperimentClick, // 新しく追加
}) => {
  const { isLoading, loadProjects, loadExperiments, createProject, createExperiment } = useGraphQL();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectExperiments, setProjectExperiments] = useState<Record<string, Experiment[]>>({});
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

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
              [projectId]: experiments
            }));
          })
          .catch(console.error);
      }
    }
    setExpandedProjects(newExpanded);
  };

  // プロジェクト作成
  const handleCreateProject = async () => {
    const projectName = prompt("新しいプロジェクト名を入力してください:");
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
    const experimentTitle = prompt("新しい実験タイトルを入力してください:");
    if (!experimentTitle?.trim()) return;
    
    try {
      await createExperiment(projectId, experimentTitle);
      // Reload experiments for this project
      const experiments = await loadExperiments(projectId);
      setProjectExperiments(prev => ({
        ...prev,
        [projectId]: experiments
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
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Project
            </div>
          )}
        </button>
      </li>
      
      {/* プロジェクト一覧 */}
      {projects.map((project) => (
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