-- Create plugins table
CREATE TABLE plugins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    author TEXT,
    source_code TEXT NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    installed_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_plugins_name ON plugins(name);
CREATE INDEX idx_plugins_enabled ON plugins(is_enabled);
CREATE INDEX idx_plugins_installed_at ON plugins(installed_at);

-- Create unique constraint for name+version combination
CREATE UNIQUE INDEX idx_plugins_name_version ON plugins(name, version);
