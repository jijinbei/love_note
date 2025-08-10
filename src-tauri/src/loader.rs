use async_graphql::{
    dataloader::Loader,
    FieldError
};
use std::collections::HashMap;
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{User, Workspace, Project, Experiment, Block, Image};

/// UserLoader - loads all users or specific ones by ID
pub struct UserLoader(SqlitePool);

impl UserLoader {
    pub fn new(pool: SqlitePool) -> Self {
        Self(pool)
    }
}

impl Loader<()> for UserLoader {
    type Value = Vec<User>;
    type Error = FieldError;

    async fn load(&self, _keys: &[()]) -> Result<HashMap<(), Self::Value>, Self::Error> {
        let users = sqlx::query_as::<_, User>("SELECT * FROM users ORDER BY created_at DESC")
            .fetch_all(&self.0)
            .await?;
        
        let mut result = HashMap::new();
        result.insert((), users);
        Ok(result)
    }
}


/// WorkspaceLoader - loads all workspaces or specific ones by ID
pub struct WorkspaceLoader(SqlitePool);

impl WorkspaceLoader {
    pub fn new(pool: SqlitePool) -> Self {
        Self(pool)
    }
}

impl Loader<()> for WorkspaceLoader {
    type Value = Vec<Workspace>;
    type Error = FieldError;

    async fn load(&self, _keys: &[()]) -> Result<HashMap<(), Self::Value>, Self::Error> {
        let workspaces = sqlx::query_as::<_, Workspace>("SELECT * FROM workspaces ORDER BY created_at DESC")
            .fetch_all(&self.0)
            .await?;
        
        let mut result = HashMap::new();
        result.insert((), workspaces);
        Ok(result)
    }
}

/// ProjectLoader - loads projects by workspace_id
pub struct ProjectLoader(SqlitePool);

impl ProjectLoader {
    pub fn new(pool: SqlitePool) -> Self {
        Self(pool)
    }
}

impl Loader<Uuid> for ProjectLoader {
    type Value = Vec<Project>;
    type Error = FieldError;

    async fn load(&self, workspace_ids: &[Uuid]) -> Result<HashMap<Uuid, Self::Value>, Self::Error> {
        let mut projects_map = HashMap::new();
        
        for workspace_id in workspace_ids {
            let projects = sqlx::query_as::<_, Project>(
                "SELECT * FROM projects WHERE workspace_id = ? ORDER BY created_at DESC"
            )
            .bind(workspace_id)
            .fetch_all(&self.0)
            .await?;
            
            projects_map.insert(*workspace_id, projects);
        }
        
        Ok(projects_map)
    }
}

/// ExperimentLoader - loads experiments by project_id
pub struct ExperimentLoader(SqlitePool);

impl ExperimentLoader {
    pub fn new(pool: SqlitePool) -> Self {
        Self(pool)
    }
}

impl Loader<Uuid> for ExperimentLoader {
    type Value = Vec<Experiment>;
    type Error = FieldError;

    async fn load(&self, project_ids: &[Uuid]) -> Result<HashMap<Uuid, Self::Value>, Self::Error> {
        let mut experiments_map = HashMap::new();
        
        for project_id in project_ids {
            let experiments = sqlx::query_as::<_, Experiment>(
                "SELECT * FROM experiments WHERE project_id = ? ORDER BY created_at DESC"
            )
            .bind(project_id)
            .fetch_all(&self.0)
            .await?;
            
            experiments_map.insert(*project_id, experiments);
        }
        
        Ok(experiments_map)
    }
}

/// BlockLoader - loads blocks by experiment_id
pub struct BlockLoader(SqlitePool);

impl BlockLoader {
    pub fn new(pool: SqlitePool) -> Self {
        Self(pool)
    }
}

impl Loader<Uuid> for BlockLoader {
    type Value = Vec<Block>;
    type Error = FieldError;

    async fn load(&self, experiment_ids: &[Uuid]) -> Result<HashMap<Uuid, Self::Value>, Self::Error> {
        let mut blocks_map = HashMap::new();
        
        for experiment_id in experiment_ids {
            let blocks = sqlx::query_as::<_, Block>(
                "SELECT * FROM blocks WHERE experiment_id = ? ORDER BY order_index ASC"
            )
            .bind(experiment_id)
            .fetch_all(&self.0)
            .await?;
            
            blocks_map.insert(*experiment_id, blocks);
        }
        
        Ok(blocks_map)
    }
}

/// ImageLoader - loads images by workspace_id
pub struct ImageLoader(SqlitePool);

impl ImageLoader {
    pub fn new(pool: SqlitePool) -> Self {
        Self(pool)
    }
}

impl Loader<Uuid> for ImageLoader {
    type Value = Vec<Image>;
    type Error = FieldError;

    async fn load(&self, workspace_ids: &[Uuid]) -> Result<HashMap<Uuid, Self::Value>, Self::Error> {
        let mut images_map = HashMap::new();
        
        for workspace_id in workspace_ids {
            let images = sqlx::query_as::<_, Image>(
                "SELECT * FROM images WHERE workspace_id = ? ORDER BY created_at DESC"
            )
            .bind(workspace_id)
            .fetch_all(&self.0)
            .await?;
            
            images_map.insert(*workspace_id, images);
        }
        
        Ok(images_map)
    }
}

/// ImageByIdLoader - loads individual images by ID
pub struct ImageByIdLoader(SqlitePool);

impl ImageByIdLoader {
    pub fn new(pool: SqlitePool) -> Self {
        Self(pool)
    }
}

impl Loader<Uuid> for ImageByIdLoader {
    type Value = Option<Image>;
    type Error = FieldError;

    async fn load(&self, image_ids: &[Uuid]) -> Result<HashMap<Uuid, Self::Value>, Self::Error> {
        let mut images_map = HashMap::new();
        
        for image_id in image_ids {
            let image = sqlx::query_as::<_, Image>(
                "SELECT * FROM images WHERE id = ?"
            )
            .bind(image_id)
            .fetch_optional(&self.0)
            .await?;
            
            images_map.insert(*image_id, image);
        }
        
        Ok(images_map)
    }
}

