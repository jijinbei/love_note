use anyhow::{Context, Result};
use directories::ProjectDirs;
use redb::{Database, ReadableDatabase, ReadableTable, TableDefinition};
use std::path::PathBuf;
use uuid::Uuid;

use super::Document;

/// Table for storing documents (key: UUID bytes, value: JSON bytes)
const DOCUMENTS_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("documents");

/// Storage manager using redb
pub struct Storage {
    db: Database,
}

impl Storage {
    /// Open or create the database
    pub fn open() -> Result<Self> {
        let db_path = Self::db_path()?;

        // Create parent directory if needed
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .context("Failed to create data directory")?;
        }

        let db = Database::create(&db_path)
            .context("Failed to open database")?;

        // Initialize table if it doesn't exist
        {
            let write_txn = db.begin_write()?;
            let _ = write_txn.open_table(DOCUMENTS_TABLE)?;
            write_txn.commit()?;
        }

        Ok(Self { db })
    }

    /// Get the database file path
    fn db_path() -> Result<PathBuf> {
        let proj_dirs = ProjectDirs::from("com", "lovenote", "LoveNote")
            .context("Failed to determine project directories")?;

        let data_dir = proj_dirs.data_dir();
        Ok(data_dir.join("documents.redb"))
    }

    /// Save a document to the database
    pub fn save_document(&self, doc: &Document) -> Result<()> {
        let write_txn = self.db.begin_write()?;
        {
            let mut table = write_txn.open_table(DOCUMENTS_TABLE)?;

            let key = doc.id.as_bytes().as_slice();
            let value = serde_json::to_vec(doc)?;

            table.insert(key, value.as_slice())?;
        }
        write_txn.commit()?;

        Ok(())
    }

    /// Load a document from the database
    pub fn load_document(&self, doc_id: Uuid) -> Result<Option<Document>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(DOCUMENTS_TABLE)?;

        let key = doc_id.as_bytes().as_slice();

        if let Some(guard) = table.get(key)? {
            let bytes: &[u8] = guard.value();
            let doc: Document = serde_json::from_slice(bytes)?;
            Ok(Some(doc))
        } else {
            Ok(None)
        }
    }

    /// List all document IDs and titles
    pub fn list_documents(&self) -> Result<Vec<(Uuid, String)>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(DOCUMENTS_TABLE)?;

        let mut docs = Vec::new();
        for result in table.iter()? {
            let (_, value_guard) = result?;
            let bytes: &[u8] = value_guard.value();
            let doc: Document = serde_json::from_slice(bytes)?;
            docs.push((doc.id, doc.title));
        }

        Ok(docs)
    }

    /// Delete a document from the database
    pub fn delete_document(&self, doc_id: Uuid) -> Result<bool> {
        let write_txn = self.db.begin_write()?;
        let removed = {
            let mut table = write_txn.open_table(DOCUMENTS_TABLE)?;
            let key = doc_id.as_bytes().as_slice();
            table.remove(key)?.is_some()
        };
        write_txn.commit()?;

        Ok(removed)
    }

    /// Get or create a default document
    pub fn get_or_create_default(&self) -> Result<Document> {
        // Try to load the first document
        let docs = self.list_documents()?;

        if let Some((id, _)) = docs.first() {
            if let Some(doc) = self.load_document(*id)? {
                return Ok(doc);
            }
        }

        // Create a new default document
        let doc = Document::new("My First Note");
        self.save_document(&doc)?;
        Ok(doc)
    }
}
