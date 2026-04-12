use anyhow::{Context, Result};
use directories::ProjectDirs;
use redb::Database;
use std::path::PathBuf;

/// Storage manager using redb
pub struct Storage {
    db: Database,
}

impl Storage {
    /// Open or create the database at the default path
    pub fn open() -> Result<Self> {
        let db_path = Self::default_db_path()?;
        Self::open_at(db_path)
    }

    /// Open or create the database at a specific path
    pub fn open_at(db_path: PathBuf) -> Result<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .context("Failed to create data directory")?;
        }

        let db = Database::create(&db_path)
            .context("Failed to open database")?;

        Ok(Self { db })
    }

    /// Get the default database file path
    fn default_db_path() -> Result<PathBuf> {
        let proj_dirs = ProjectDirs::from("com", "lovenote", "LoveNote")
            .context("Failed to determine project directories")?;

        let data_dir = proj_dirs.data_dir();
        Ok(data_dir.join("documents.redb"))
    }
}
