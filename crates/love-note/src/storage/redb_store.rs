use anyhow::{Context, Result};
use directories::ProjectDirs;
use redb::{Database, ReadableDatabase, ReadableTable, TableDefinition};
use std::path::PathBuf;
use uuid::Uuid;

use super::revision::{self, Revision, ChainStatus};
use super::signature::SignatureRecord;
use super::TypstDocument;

const DOCUMENTS_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("typst_documents");
const REVISIONS_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("revisions");
const REVISION_INDEX_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("revision_index");
const SIGNATURES_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("signatures");

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

        // Initialize tables
        {
            let write_txn = db.begin_write()?;
            let _ = write_txn.open_table(DOCUMENTS_TABLE)?;
            let _ = write_txn.open_table(REVISIONS_TABLE)?;
            let _ = write_txn.open_table(REVISION_INDEX_TABLE)?;
            let _ = write_txn.open_table(SIGNATURES_TABLE)?;
            write_txn.commit()?;
        }

        tracing::debug!("Database opened at {}", db_path.display());
        Ok(Self { db })
    }

    fn default_db_path() -> Result<PathBuf> {
        let proj_dirs = ProjectDirs::from("com", "lovenote", "LoveNote")
            .context("Failed to determine project directories")?;
        Ok(proj_dirs.data_dir().join("documents.redb"))
    }

    // === Document CRUD ===

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

    // === Revision CRUD ===

    /// Save a revision and update the index.
    pub fn save_revision(&self, rev: &Revision) -> Result<()> {
        let write_txn = self.db.begin_write()?;
        {
            let mut rev_table = write_txn.open_table(REVISIONS_TABLE)?;
            let value = serde_json::to_vec(rev)?;
            rev_table.insert(rev.hash.as_slice(), value.as_slice())?;

            let mut idx_table = write_txn.open_table(REVISION_INDEX_TABLE)?;
            let idx_key = make_index_key(rev.doc_id, rev.sequence);
            idx_table.insert(idx_key.as_slice(), rev.hash.as_slice())?;
        }
        write_txn.commit()?;
        tracing::debug!(seq = rev.sequence, doc_id = %rev.doc_id, "Revision saved");
        Ok(())
    }

    /// Create a new revision linked to the latest revision for this document.
    pub fn create_revision(
        &self,
        doc_id: Uuid,
        content: String,
        frontmatter: serde_json::Value,
        author: String,
        change_summary: String,
    ) -> Result<Revision> {
        let latest = self.get_latest_revision(doc_id)?;
        let rev = revision::create_revision(
            doc_id,
            content,
            frontmatter,
            author,
            change_summary,
            latest.as_ref(),
        );
        self.save_revision(&rev)?;
        tracing::info!(seq = rev.sequence, doc_id = %doc_id, "Revision created");
        Ok(rev)
    }

    /// Load a revision by its hash.
    pub fn load_revision(&self, hash: &[u8; 32]) -> Result<Option<Revision>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(REVISIONS_TABLE)?;

        if let Some(guard) = table.get(hash.as_slice())? {
            let rev: Revision = serde_json::from_slice(guard.value())?;
            Ok(Some(rev))
        } else {
            Ok(None)
        }
    }

    /// List all revisions for a document, sorted by sequence.
    pub fn list_revisions(&self, doc_id: Uuid) -> Result<Vec<Revision>> {
        let read_txn = self.db.begin_read()?;
        let idx_table = read_txn.open_table(REVISION_INDEX_TABLE)?;
        let rev_table = read_txn.open_table(REVISIONS_TABLE)?;

        let prefix = doc_id.as_bytes().to_vec();
        let mut revisions = Vec::new();

        for result in idx_table.iter()? {
            let (key_guard, value_guard) = result?;
            let key: &[u8] = key_guard.value();

            // Check if this key belongs to our doc_id (first 16 bytes)
            if key.len() == 24 && key[..16] == prefix[..] {
                let hash: &[u8] = value_guard.value();
                if let Some(guard) = rev_table.get(hash)? {
                    let rev: Revision = serde_json::from_slice(guard.value())?;
                    revisions.push(rev);
                }
            }
        }

        revisions.sort_by_key(|r| r.sequence);
        Ok(revisions)
    }

    /// Get the latest revision for a document.
    pub fn get_latest_revision(&self, doc_id: Uuid) -> Result<Option<Revision>> {
        let revisions = self.list_revisions(doc_id)?;
        Ok(revisions.into_iter().last())
    }

    /// Verify the hash chain for a document.
    pub fn verify_chain(&self, doc_id: Uuid) -> Result<ChainStatus> {
        let revisions = self.list_revisions(doc_id)?;
        Ok(revision::verify_chain(&revisions))
    }

    // === Signature CRUD ===

    /// Save a signature record (keyed by revision_hash).
    pub fn save_signature(&self, record: &SignatureRecord) -> Result<()> {
        let write_txn = self.db.begin_write()?;
        {
            let mut table = write_txn.open_table(SIGNATURES_TABLE)?;
            let value = serde_json::to_vec(record)?;
            table.insert(record.revision_hash.as_slice(), value.as_slice())?;
        }
        write_txn.commit()?;
        tracing::info!(
            meaning = %record.meaning,
            signer = %record.signer,
            "Signature saved"
        );
        Ok(())
    }

    /// Load a signature for a revision hash.
    pub fn load_signature(&self, revision_hash: &[u8; 32]) -> Result<Option<SignatureRecord>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(SIGNATURES_TABLE)?;

        if let Some(guard) = table.get(revision_hash.as_slice())? {
            let record: SignatureRecord = serde_json::from_slice(guard.value())?;
            Ok(Some(record))
        } else {
            Ok(None)
        }
    }
}

/// Build the index key: doc_id (16 bytes) + sequence (8 bytes LE)
fn make_index_key(doc_id: Uuid, sequence: u64) -> Vec<u8> {
    let mut key = Vec::with_capacity(24);
    key.extend_from_slice(doc_id.as_bytes());
    key.extend_from_slice(&sequence.to_le_bytes());
    key
}
