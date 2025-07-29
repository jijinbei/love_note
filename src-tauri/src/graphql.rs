use async_graphql::{Context, Object, Schema, Result, dataloader::DataLoader};
use sqlx::SqlitePool;
use uuid::Uuid;
use chrono::Utc;
use crate::models::{
    Workspace, Project, Experiment, Block,
    CreateWorkspaceRequest, CreateProjectRequest, CreateExperimentRequest, CreateBlockInput
};
use crate::loader::{WorkspaceLoader, ProjectLoader, ExperimentLoader, BlockLoader};

// GraphQL Query resolver
pub struct Query;

#[Object]
impl Query {
    async fn workspaces(&self, ctx: &Context<'_>) -> Result<Vec<Workspace>> {
        let loader = ctx.data::<DataLoader<WorkspaceLoader>>()?;
        let workspaces = loader.load_one(()).await?
            .unwrap_or_default();
        Ok(workspaces)
    }

    async fn projects(&self, ctx: &Context<'_>, workspace_id: String) -> Result<Vec<Project>> {
        let loader = ctx.data::<DataLoader<ProjectLoader>>()?;
        let projects = loader.load_one(workspace_id).await?
            .unwrap_or_default();
        Ok(projects)
    }

    async fn experiments(&self, ctx: &Context<'_>, project_id: String) -> Result<Vec<Experiment>> {
        let loader = ctx.data::<DataLoader<ExperimentLoader>>()?;
        let experiments = loader.load_one(project_id).await?
            .unwrap_or_default();
        Ok(experiments)
    }

    async fn blocks(&self, ctx: &Context<'_>, experiment_id: String) -> Result<Vec<Block>> {
        let loader = ctx.data::<DataLoader<BlockLoader>>()?;
        let blocks = loader.load_one(experiment_id).await?
            .unwrap_or_default();
        Ok(blocks)
    }
}

// GraphQL Mutation resolver
pub struct Mutation;

#[Object]
impl Mutation {
    async fn create_workspace(&self, ctx: &Context<'_>, input: CreateWorkspaceRequest) -> Result<Workspace> {
        let pool = ctx.data::<SqlitePool>()?;
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let workspace = Workspace {
            id: id.clone(),
            name: input.name.clone(),
            description: input.description.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        sqlx::query("INSERT INTO workspaces (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
            .bind(&workspace.id)
            .bind(&workspace.name)
            .bind(&workspace.description)
            .bind(&workspace.created_at)
            .bind(&workspace.updated_at)
            .execute(pool)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(workspace)
    }

    async fn create_project(&self, ctx: &Context<'_>, input: CreateProjectRequest) -> Result<Project> {
        let pool = ctx.data::<SqlitePool>()?;
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let project = Project {
            id: id.clone(),
            workspace_id: input.workspace_id.clone(),
            name: input.name.clone(),
            description: input.description.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        sqlx::query("INSERT INTO projects (id, workspace_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(&project.id)
            .bind(&project.workspace_id)
            .bind(&project.name)
            .bind(&project.description)
            .bind(&project.created_at)
            .bind(&project.updated_at)
            .execute(pool)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(project)
    }

    async fn create_experiment(&self, ctx: &Context<'_>, input: CreateExperimentRequest) -> Result<Experiment> {
        let pool = ctx.data::<SqlitePool>()?;
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let experiment = Experiment {
            id: id.clone(),
            project_id: input.project_id.clone(),
            title: input.title.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        sqlx::query("INSERT INTO experiments (id, project_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
            .bind(&experiment.id)
            .bind(&experiment.project_id)
            .bind(&experiment.title)
            .bind(&experiment.created_at)
            .bind(&experiment.updated_at)
            .execute(pool)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(experiment)
    }

    async fn create_block(&self, ctx: &Context<'_>, input: CreateBlockInput) -> Result<Block> {
        let pool = ctx.data::<SqlitePool>()?;
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let request = input.to_request()
            .map_err(|e| async_graphql::Error::new(format!("Invalid block content: {}", e)))?;

        let content_json = serde_json::to_string(&request.content)
            .map_err(|e| async_graphql::Error::new(format!("Content serialization error: {}", e)))?;

        let block = Block {
            id: id.clone(),
            experiment_id: request.experiment_id.clone(),
            block_type: request.block_type.clone(),
            content: content_json.clone(),
            order_index: request.order_index,
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        sqlx::query("INSERT INTO blocks (id, experiment_id, block_type, content, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(&block.id)
            .bind(&block.experiment_id)
            .bind(&block.block_type)
            .bind(&content_json)
            .bind(&block.order_index)
            .bind(&block.created_at)
            .bind(&block.updated_at)
            .execute(pool)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(block)
    }
}

// GraphQL Schema type
pub type LoveNoteSchema = Schema<Query, Mutation, async_graphql::EmptySubscription>;

// Schema builder function with DataLoaders and SqlitePool
pub fn create_schema_with_loaders(pool: SqlitePool) -> LoveNoteSchema {
    Schema::build(Query, Mutation, async_graphql::EmptySubscription)
        .data(DataLoader::new(
            WorkspaceLoader::new(pool.clone()),
            tokio::spawn,
        ))
        .data(DataLoader::new(
            ProjectLoader::new(pool.clone()),
            tokio::spawn,
        ))
        .data(DataLoader::new(
            ExperimentLoader::new(pool.clone()),
            tokio::spawn,
        ))
        .data(DataLoader::new(
            BlockLoader::new(pool.clone()),
            tokio::spawn,
        ))
        .data(pool)
        .finish()
}

// Schema builder function without DataLoaders for SDL export
pub fn create_schema_for_sdl() -> LoveNoteSchema {
    Schema::build(Query, Mutation, async_graphql::EmptySubscription)
        .finish()
}