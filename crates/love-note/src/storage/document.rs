use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A block stored in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredBlock {
    pub id: Uuid,
    pub kind: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl StoredBlock {
    pub fn new(kind: impl Into<String>, content: impl Into<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            kind: kind.into(),
            content: content.into(),
            created_at: now,
            updated_at: now,
        }
    }

    pub fn update_content(&mut self, content: impl Into<String>) {
        self.content = content.into();
        self.updated_at = Utc::now();
    }
}

/// A document containing multiple blocks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub blocks: Vec<StoredBlock>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Document {
    pub fn new(title: impl Into<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            title: title.into(),
            blocks: Vec::new(),
            created_at: now,
            updated_at: now,
        }
    }

    pub fn add_block(&mut self, block: StoredBlock) {
        self.blocks.push(block);
        self.updated_at = Utc::now();
    }

    pub fn insert_block(&mut self, index: usize, block: StoredBlock) {
        self.blocks.insert(index, block);
        self.updated_at = Utc::now();
    }

    pub fn update_block(&mut self, block_id: Uuid, content: impl Into<String>) -> bool {
        if let Some(block) = self.blocks.iter_mut().find(|b| b.id == block_id) {
            block.update_content(content);
            self.updated_at = Utc::now();
            true
        } else {
            false
        }
    }

    pub fn remove_block(&mut self, block_id: Uuid) -> Option<StoredBlock> {
        if let Some(index) = self.blocks.iter().position(|b| b.id == block_id) {
            self.updated_at = Utc::now();
            Some(self.blocks.remove(index))
        } else {
            None
        }
    }

    pub fn get_block(&self, block_id: Uuid) -> Option<&StoredBlock> {
        self.blocks.iter().find(|b| b.id == block_id)
    }
}

impl Default for Document {
    fn default() -> Self {
        Self::new("Untitled")
    }
}
