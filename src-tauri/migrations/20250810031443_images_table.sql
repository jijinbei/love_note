-- Create images table
CREATE TABLE images (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_images_workspace_id ON images(workspace_id);
CREATE INDEX idx_images_created_at ON images(created_at);
