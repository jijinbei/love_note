use crate::models::{Document, CreateDocumentRequest, UpdateDocumentRequest};
use chrono::Utc;
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

pub struct DocumentService {
    pool: SqlitePool,
}

impl DocumentService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    // Create: Create a new document
    pub async fn create_document(&self, request: CreateDocumentRequest) -> Result<Document, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let document = Document {
            id: id.clone(),
            title: request.title,
            created_at: now.clone(),
            updated_at: now,
        };

        sqlx::query("INSERT INTO documents (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)")
            .bind(&document.id)
            .bind(&document.title)
            .bind(&document.created_at)
            .bind(&document.updated_at)
            .execute(&self.pool)
            .await?;

        Ok(document)
    }

    // Read: Get document by ID
    pub async fn get_document_by_id(&self, id: &str) -> Result<Option<Document>, sqlx::Error> {
        let row = sqlx::query("SELECT id, title, created_at, updated_at FROM documents WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        match row {
            Some(row) => {
                let document = Document {
                    id: row.get("id"),
                    title: row.get("title"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                };
                Ok(Some(document))
            }
            None => Ok(None),
        }
    }

    // Read: Get all documents
    pub async fn list_documents(&self) -> Result<Vec<Document>, sqlx::Error> {
        let rows = sqlx::query("SELECT id, title, created_at, updated_at FROM documents ORDER BY updated_at DESC")
            .fetch_all(&self.pool)
            .await?;

        let documents: Vec<Document> = rows.into_iter().map(|row| Document {
            id: row.get("id"),
            title: row.get("title"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }).collect();

        Ok(documents)
    }

    // Update: Update document title
    pub async fn update_document(&self, id: &str, request: UpdateDocumentRequest) -> Result<Option<Document>, sqlx::Error> {
        let now = Utc::now().to_rfc3339();

        let result = sqlx::query("UPDATE documents SET title = ?, updated_at = ? WHERE id = ?")
            .bind(&request.title)
            .bind(&now)
            .bind(id)
            .execute(&self.pool)
            .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
    }

        // Get and return the updated document
        self.get_document_by_id(id).await
    }

    // Delete: Delete document
    pub async fn delete_document(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM documents WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}