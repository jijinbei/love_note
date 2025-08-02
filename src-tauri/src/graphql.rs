use async_graphql::{Context, Object, Schema, Result, dataloader::DataLoader};
use sqlx::SqlitePool;
use uuid::Uuid;
use chrono::Utc;
use crate::models::{
    User, Workspace, Project, Experiment, Block,
    CreateUserRequest, CreateWorkspaceRequest, CreateProjectRequest, CreateExperimentRequest, CreateBlockInput
};
use crate::loader::{UserLoader, WorkspaceLoader, ProjectLoader, ExperimentLoader, BlockLoader};

// GraphQL Query resolver
pub struct Query;

#[Object]
impl Query {
    async fn users(&self, ctx: &Context<'_>) -> Result<Vec<User>> {
        let loader = ctx.data::<DataLoader<UserLoader>>()?;
        let users = loader.load_one(()).await?
            .unwrap_or_default();
        Ok(users)
    }

    async fn workspaces(&self, ctx: &Context<'_>) -> Result<Vec<Workspace>> {
        let loader = ctx.data::<DataLoader<WorkspaceLoader>>()?;
        let workspaces = loader.load_one(()).await?
            .unwrap_or_default();
        Ok(workspaces)
    }

    async fn projects(&self, ctx: &Context<'_>, workspace_id: Uuid) -> Result<Vec<Project>> {
        let loader = ctx.data::<DataLoader<ProjectLoader>>()?;
        let projects = loader.load_one(workspace_id).await?
            .unwrap_or_default();
        Ok(projects)
    }

    async fn experiments(&self, ctx: &Context<'_>, project_id: Uuid) -> Result<Vec<Experiment>> {
        let loader = ctx.data::<DataLoader<ExperimentLoader>>()?;
        let experiments = loader.load_one(project_id).await?
            .unwrap_or_default();
        Ok(experiments)
    }

    async fn blocks(&self, ctx: &Context<'_>, experiment_id: Uuid) -> Result<Vec<Block>> {
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
    async fn create_user(&self, ctx: &Context<'_>, input: CreateUserRequest) -> Result<User> {
        let pool = ctx.data::<SqlitePool>()?;
        let id = Uuid::new_v4();
        let now = Utc::now();

        let user = User {
            id: id,
            username: input.username.clone(),
            email: input.email.clone(),
            display_name: input.display_name.clone(),
            created_at: now,
            updated_at: now,
        };

        sqlx::query("INSERT INTO users (id, username, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(&user.id)
            .bind(&user.username)
            .bind(&user.email)
            .bind(&user.display_name)
            .bind(&user.created_at)
            .bind(&user.updated_at)
            .execute(pool)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(user)
    }

    async fn create_workspace(&self, ctx: &Context<'_>, input: CreateWorkspaceRequest) -> Result<Workspace> {
        let pool = ctx.data::<SqlitePool>()?;
        let id = Uuid::new_v4();
        let now = Utc::now();

        let workspace = Workspace {
            id: id,
            name: input.name.clone(),
            description: input.description.clone(),
            created_at: now,
            updated_at: now,
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
        let id = Uuid::new_v4();
        let now = Utc::now();

        let project = Project {
            id: id,
            workspace_id: input.workspace_id,
            name: input.name.clone(),
            description: input.description.clone(),
            created_at: now,
            updated_at: now,
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
        let id = Uuid::new_v4();
        let now = Utc::now();

        let experiment = Experiment {
            id: id,
            project_id: input.project_id,
            title: input.title.clone(),
            created_at: now,
            updated_at: now,
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
        let id = Uuid::new_v4();
        let now = Utc::now();

        let request = input.to_request()
            .map_err(|e| async_graphql::Error::new(format!("Invalid block content: {}", e)))?;

        let content_json = serde_json::to_string(&request.content)
            .map_err(|e| async_graphql::Error::new(format!("Content serialization error: {}", e)))?;

        let block = Block {
            id: id,
            experiment_id: request.experiment_id,
            block_type: request.block_type.clone(),
            content: content_json.clone(),
            order_index: request.order_index,
            created_at: now,
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
            UserLoader::new(pool.clone()),
            tokio::spawn,
        ))
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