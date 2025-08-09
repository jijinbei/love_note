import React from 'react';
import type { Project, Experiment } from '../../generated/graphql';

interface ProjectItemProps {
  project: Project;
  experiments: Experiment[];
  isExpanded: boolean;
  isLoading: boolean;
  onToggle: (projectId: string) => void;
  onCreateExperiment: (projectId: string) => void;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  experiments,
  isExpanded,
  isLoading,
  onToggle,
  onCreateExperiment,
}) => {
  return (
    <li className="mb-1">
      <div className="group flex flex-col w-full px-2 py-1 rounded hover:bg-blue-50">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => onToggle(project.id)}
          title={`${project.name} を折りたたむ/展開`}
        >
          {/* 折りたたみアイコン */}
          <div className="p-1 text-gray-400">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              {isExpanded ? (
                <polyline points="6 9 12 15 18 9" stroke="currentColor" fill="none" />
              ) : (
                <polyline points="9 6 15 12 9 18" stroke="currentColor" fill="none" />
              )}
            </svg>
          </div>

          {/* プロジェクト名 */}
          <span className="mr-3 text-sm">📋</span>
          <span className="flex-1 truncate text-left text-sm">{project.name}</span>

          {/* 実験追加ボタン - ホバー時のみ表示 */}
          <button
            className="p-1 rounded hover:bg-blue-200 transition text-gray-400 opacity-0 group-hover:opacity-100"
            title={`${project.name} に実験を追加`}
            onClick={(e) => {
              e.stopPropagation();
              onCreateExperiment(project.id);
            }}
            disabled={isLoading}
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" />
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" />
            </svg>
          </button>
        </div>

        {/* 実験リスト */}
        {isExpanded && experiments.length > 0 && (
          <ul className="pl-6 space-y-1 mt-1">
            {experiments.map((experiment) => (
              <li key={experiment.id} className="text-sm text-gray-600 flex items-center p-1 rounded hover:bg-yellow-50">
                <span className="mr-2 text-sm">🧪</span>
                <span className="text-xs">{experiment.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};