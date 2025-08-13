import type { Workspace, Project, Experiment } from '../../generated/graphql';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

export type SidebarProps = {
  items: SidebarItem[];
  onFixedChange?: (fixed: boolean) => void;
};

export interface WorkspaceContentItemProps {
  workspaceId: string;
}

export interface ProjectItemProps {
  project: Project;
}

export { Workspace, Project, Experiment };
