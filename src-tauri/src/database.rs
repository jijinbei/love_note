use crate::models::{
    Document, CreateDocumentRequest, UpdateDocumentRequest,
    Workspace, CreateWorkspaceRequest,
    Project, CreateProjectRequest,
    Experiment, CreateExperimentRequest,
    Block, CreateBlockRequest, UpdateBlockRequest,
};
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

// Workspace Service
pub struct WorkspaceService {
    pool: SqlitePool,
}

impl WorkspaceService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create_workspace(&self, request: CreateWorkspaceRequest) -> Result<Workspace, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let workspace = Workspace {
            id: id.clone(),
            name: request.name,
            description: request.description,
            created_at: now.clone(),
            updated_at: now,
        };

        sqlx::query("INSERT INTO workspaces (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
            .bind(&workspace.id)
            .bind(&workspace.name)
            .bind(&workspace.description)
            .bind(&workspace.created_at)
            .bind(&workspace.updated_at)
            .execute(&self.pool)
            .await?;

        Ok(workspace)
    }

    pub async fn list_workspaces(&self) -> Result<Vec<Workspace>, sqlx::Error> {
        let rows = sqlx::query("SELECT id, name, description, created_at, updated_at FROM workspaces ORDER BY created_at DESC")
            .fetch_all(&self.pool)
            .await?;

        let workspaces: Vec<Workspace> = rows.into_iter().map(|row| Workspace {
            id: row.get("id"),
            name: row.get("name"),
            description: row.get("description"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }).collect();

        Ok(workspaces)
    }
}

// Project Service
pub struct ProjectService {
    pool: SqlitePool,
}

impl ProjectService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create_project(&self, request: CreateProjectRequest) -> Result<Project, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let project = Project {
            id: id.clone(),
            workspace_id: request.workspace_id,
            name: request.name,
            description: request.description,
            created_at: now.clone(),
            updated_at: now,
        };

        sqlx::query("INSERT INTO projects (id, workspace_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(&project.id)
            .bind(&project.workspace_id)
            .bind(&project.name)
            .bind(&project.description)
            .bind(&project.created_at)
            .bind(&project.updated_at)
            .execute(&self.pool)
            .await?;

        Ok(project)
    }

    pub async fn list_projects_by_workspace(&self, workspace_id: &str) -> Result<Vec<Project>, sqlx::Error> {
        let rows = sqlx::query("SELECT id, workspace_id, name, description, created_at, updated_at FROM projects WHERE workspace_id = ? ORDER BY created_at DESC")
            .bind(workspace_id)
            .fetch_all(&self.pool)
            .await?;

        let projects: Vec<Project> = rows.into_iter().map(|row| Project {
            id: row.get("id"),
            workspace_id: row.get("workspace_id"),
            name: row.get("name"),
            description: row.get("description"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }).collect();

        Ok(projects)
    }
}

// Experiment Service
pub struct ExperimentService {
    pool: SqlitePool,
}

impl ExperimentService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create_experiment(&self, request: CreateExperimentRequest) -> Result<Experiment, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let experiment = Experiment {
            id: id.clone(),
            project_id: request.project_id,
            title: request.title,
            created_at: now.clone(),
            updated_at: now,
        };

        sqlx::query("INSERT INTO experiments (id, project_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
            .bind(&experiment.id)
            .bind(&experiment.project_id)
            .bind(&experiment.title)
            .bind(&experiment.created_at)
            .bind(&experiment.updated_at)
            .execute(&self.pool)
            .await?;

        Ok(experiment)
    }

    pub async fn list_experiments_by_project(&self, project_id: &str) -> Result<Vec<Experiment>, sqlx::Error> {
        let rows = sqlx::query("SELECT id, project_id, title, created_at, updated_at FROM experiments WHERE project_id = ? ORDER BY created_at DESC")
            .bind(project_id)
            .fetch_all(&self.pool)
            .await?;

        let experiments: Vec<Experiment> = rows.into_iter().map(|row| Experiment {
            id: row.get("id"),
            project_id: row.get("project_id"),
            title: row.get("title"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }).collect();

        Ok(experiments)
    }
}

// Block Service
pub struct BlockService {
    pool: SqlitePool,
}

impl BlockService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create_block(&self, request: CreateBlockRequest) -> Result<Block, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        let content_json = serde_json::to_string(&request.content).map_err(|e| {
            sqlx::Error::Encode(Box::new(e))
        })?;

        let block = Block {
            id: id.clone(),
            experiment_id: request.experiment_id,
            block_type: request.block_type,
            content: content_json.clone(),
            order_index: request.order_index,
            created_at: now.clone(),
            updated_at: now,
        };

        sqlx::query("INSERT INTO blocks (id, experiment_id, block_type, content, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(&block.id)
            .bind(&block.experiment_id)
            .bind(&block.block_type)
            .bind(&content_json)
            .bind(&block.order_index)
            .bind(&block.created_at)
            .bind(&block.updated_at)
            .execute(&self.pool)
            .await?;

        Ok(block)
    }

    pub async fn list_blocks_by_experiment(&self, experiment_id: &str) -> Result<Vec<Block>, sqlx::Error> {
        let rows = sqlx::query("SELECT id, experiment_id, block_type, content, order_index, created_at, updated_at FROM blocks WHERE experiment_id = ? ORDER BY order_index ASC")
            .bind(experiment_id)
            .fetch_all(&self.pool)
            .await?;

        let blocks: Vec<Block> = rows.into_iter().map(|row| Block {
            id: row.get("id"),
            experiment_id: row.get("experiment_id"),
            block_type: row.get("block_type"),
            content: row.get("content"),
            order_index: row.get("order_index"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }).collect();

        Ok(blocks)
    }

    pub async fn update_block(&self, block_id: &str, request: UpdateBlockRequest) -> Result<Option<Block>, sqlx::Error> {
        let now = Utc::now().to_rfc3339();
        let content_json = serde_json::to_string(&request.content).map_err(|e| {
            sqlx::Error::Encode(Box::new(e))
        })?;

        // Update content and optionally order_index
        let result = if let Some(order_index) = request.order_index {
            sqlx::query("UPDATE blocks SET content = ?, order_index = ?, updated_at = ? WHERE id = ?")
                .bind(&content_json)
                .bind(order_index)
                .bind(&now)
                .bind(block_id)
                .execute(&self.pool)
                .await?
        } else {
            sqlx::query("UPDATE blocks SET content = ?, updated_at = ? WHERE id = ?")
                .bind(&content_json)
                .bind(&now)
                .bind(block_id)
                .execute(&self.pool)
                .await?
        };

        if result.rows_affected() == 0 {
            return Ok(None);
        }

        // Fetch and return the updated block
        let row = sqlx::query("SELECT id, experiment_id, block_type, content, order_index, created_at, updated_at FROM blocks WHERE id = ?")
            .bind(block_id)
            .fetch_optional(&self.pool)
            .await?;

        match row {
            Some(row) => {
                let block = Block {
                    id: row.get("id"),
                    experiment_id: row.get("experiment_id"),
                    block_type: row.get("block_type"),
                    content: row.get("content"),
                    order_index: row.get("order_index"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                };
                Ok(Some(block))
            }
            None => Ok(None),
        }
    }
}