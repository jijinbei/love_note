-- Create workspaces table
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
);

-- Create experiments table
CREATE TABLE experiments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Create blocks table
CREATE TABLE blocks (
    id TEXT PRIMARY KEY,
    experiment_id TEXT NOT NULL,
    block_type TEXT NOT NULL, -- 'NoteBlock', 'SampleRefBlock', 'ProtocolRefBlock', 'ImageBlock', 'TableBlock'
    content TEXT NOT NULL,    -- JSON serialized block data
    order_index INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (experiment_id) REFERENCES experiments (id) ON DELETE CASCADE
);

-- Create samples table (master data)
CREATE TABLE samples (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    properties TEXT NOT NULL, -- JSON serialized properties
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
);

-- Create protocols table (master data)
CREATE TABLE protocols (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    steps TEXT NOT NULL, -- JSON serialized steps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX idx_experiments_project_id ON experiments(project_id);
CREATE INDEX idx_blocks_experiment_id ON blocks(experiment_id);
CREATE INDEX idx_blocks_order ON blocks(experiment_id, order_index);
CREATE INDEX idx_samples_workspace_id ON samples(workspace_id);
CREATE INDEX idx_protocols_workspace_id ON protocols(workspace_id);
