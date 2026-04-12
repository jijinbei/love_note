use anyhow::{Context, Result};
use directories::ProjectDirs;
use redb::{Database, ReadableDatabase, ReadableTable, TableDefinition};
use std::path::PathBuf;
use uuid::Uuid;

use super::TypstDocument;

const DOCUMENTS_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("typst_documents");

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

        // Initialize table
        {
            let write_txn = db.begin_write()?;
            let _ = write_txn.open_table(DOCUMENTS_TABLE)?;
            write_txn.commit()?;
        }

        tracing::debug!("Database opened at {}", db_path.display());
        Ok(Self { db })
    }

    /// Get the default database file path
    fn default_db_path() -> Result<PathBuf> {
        let proj_dirs = ProjectDirs::from("com", "lovenote", "LoveNote")
            .context("Failed to determine project directories")?;
        Ok(proj_dirs.data_dir().join("documents.redb"))
    }

    /// Save a document
    pub fn save_document(&self, doc: &TypstDocument) -> Result<()> {
        let write_txn = self.db.begin_write()?;
        {
            let mut table = write_txn.open_table(DOCUMENTS_TABLE)?;
            let key = doc.id.as_bytes().as_slice();
            let value = serde_json::to_vec(doc)?;
            table.insert(key, value.as_slice())?;
        }
        write_txn.commit()?;
        tracing::debug!(doc_id = %doc.id, title = %doc.title, "Document saved");
        Ok(())
    }

    /// Load a document by ID
    pub fn load_document(&self, doc_id: Uuid) -> Result<Option<TypstDocument>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(DOCUMENTS_TABLE)?;
        let key = doc_id.as_bytes().as_slice();

        if let Some(guard) = table.get(key)? {
            let doc: TypstDocument = serde_json::from_slice(guard.value())?;
            Ok(Some(doc))
        } else {
            Ok(None)
        }
    }

    /// List all documents (id, title)
    pub fn list_documents(&self) -> Result<Vec<(Uuid, String)>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(DOCUMENTS_TABLE)?;

        let mut docs = Vec::new();
        for result in table.iter()? {
            let (_, value_guard) = result?;
            let doc: TypstDocument = serde_json::from_slice(value_guard.value())?;
            docs.push((doc.id, doc.title));
        }
        Ok(docs)
    }

    /// Delete a document by ID
    pub fn delete_document(&self, doc_id: Uuid) -> Result<bool> {
        let write_txn = self.db.begin_write()?;
        let removed = {
            let mut table = write_txn.open_table(DOCUMENTS_TABLE)?;
            let key = doc_id.as_bytes().as_slice();
            table.remove(key)?.is_some()
        };
        write_txn.commit()?;
        tracing::debug!(doc_id = %doc_id, removed, "Document delete attempted");
        Ok(removed)
    }

    /// Get or create a default document
    pub fn get_or_create_default(&self) -> Result<TypstDocument> {
        let docs = self.list_documents()?;
        if let Some((id, _)) = docs.first() {
            if let Some(doc) = self.load_document(*id)? {
                return Ok(doc);
            }
        }

        let doc = TypstDocument::new("Untitled Experiment");
        self.save_document(&doc)?;
        tracing::info!(doc_id = %doc.id, "Created default document");
        Ok(doc)
    }
}
