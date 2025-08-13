use crate::image_utils;
use crate::loader::{
    BlockLoader, ExperimentLoader, ImageByIdLoader, ImageLoader, ProjectLoader, UserLoader,
    WorkspaceLoader,
};
use crate::models::{
    Block, CreateBlockInput, CreateExperimentRequest, CreateProjectRequest, CreateUserRequest,
    CreateWorkspaceRequest, Experiment, Image, ImageUploadInput, Project, User, Workspace,
};
use async_graphql::{dataloader::DataLoader, ComplexObject, Context, Object, Result, Schema};
use base64::prelude::*;
use chrono::Utc;
use sqlx::SqlitePool;
use std::fs;
use uuid::Uuid;

// Image GraphQL resolver with dataUrl field
#[ComplexObject]
impl Image {
    async fn data_url(&self) -> Result<String> {
        match fs::read(&self.file_path) {
            Ok(data) => {
                let base64_data = BASE64_STANDARD.encode(&data);
                Ok(format!("data:{};base64,{}", self.mime_type, base64_data))
            }
            Err(e) => Err(async_graphql::Error::new(format!(
                "Failed to read image file: {}",
                e
            ))),
        }
    }
}

// GraphQL Query resolver
pub struct Query;

#[Object]
impl Query {
    async fn users(&self, ctx: &Context<'_>) -> Result<Vec<User>> {
        let loader = ctx.data::<DataLoader<UserLoader>>()?;
        let users = loader.load_one(()).await?.unwrap_or_default();
        Ok(users)
    }

    async fn workspaces(&self, ctx: &Context<'_>) -> Result<Vec<Workspace>> {
        let loader = ctx.data::<DataLoader<WorkspaceLoader>>()?;
        let workspaces = loader.load_one(()).await?.unwrap_or_default();
        Ok(workspaces)
    }

    async fn projects(&self, ctx: &Context<'_>, workspace_id: Uuid) -> Result<Vec<Project>> {
        let loader = ctx.data::<DataLoader<ProjectLoader>>()?;
        let projects = loader.load_one(workspace_id).await?.unwrap_or_default();
        Ok(projects)
    }

    async fn experiments(&self, ctx: &Context<'_>, project_id: Uuid) -> Result<Vec<Experiment>> {
        let loader = ctx.data::<DataLoader<ExperimentLoader>>()?;
        let experiments = loader.load_one(project_id).await?.unwrap_or_default();
        Ok(experiments)
    }

    async fn blocks(&self, ctx: &Context<'_>, experiment_id: Uuid) -> Result<Vec<Block>> {
        let loader = ctx.data::<DataLoader<BlockLoader>>()?;
        let blocks = loader.load_one(experiment_id).await?.unwrap_or_default();
        Ok(blocks)
    }

    async fn images(&self, ctx: &Context<'_>, workspace_id: Uuid) -> Result<Vec<Image>> {
        let loader = ctx.data::<DataLoader<ImageLoader>>()?;
        let images = loader.load_one(workspace_id).await?.unwrap_or_default();
        Ok(images)
    }

    async fn image(&self, ctx: &Context<'_>, id: Uuid) -> Result<Option<Image>> {
        let loader = ctx.data::<DataLoader<ImageByIdLoader>>()?;
        let image = loader.load_one(id).await?.unwrap_or_default();
        Ok(image)
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

    async fn create_workspace(
        &self,
        ctx: &Context<'_>,
        input: CreateWorkspaceRequest,
    ) -> Result<Workspace> {
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

    async fn create_project(
        &self,
        ctx: &Context<'_>,
        input: CreateProjectRequest,
    ) -> Result<Project> {
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

    async fn create_experiment(
        &self,
        ctx: &Context<'_>,
        input: CreateExperimentRequest,
    ) -> Result<Experiment> {
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

        let request = input
            .to_request()
            .map_err(|e| async_graphql::Error::new(format!("Invalid block content: {}", e)))?;

        let content_json = serde_json::to_string(&request.content).map_err(|e| {
            async_graphql::Error::new(format!("Content serialization error: {}", e))
        })?;

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

    async fn upload_image(&self, ctx: &Context<'_>, input: ImageUploadInput) -> Result<Image> {
        let pool = ctx.data::<SqlitePool>()?;
        let app_handle = ctx.data::<tauri::AppHandle>()?;

        // Decode base64 image data
        let image_data = image_utils::decode_base64_image(&input.data)
            .map_err(|e| async_graphql::Error::new(format!("Invalid image data: {}", e)))?;

        // Detect MIME type from filename
        let mime_type = image_utils::detect_mime_type(&input.filename)
            .map_err(|e| async_graphql::Error::new(format!("Unsupported file format: {}", e)))?;

        // Get image metadata
        let metadata = image_utils::get_image_metadata(&image_data, &mime_type)
            .map_err(|e| async_graphql::Error::new(format!("Image validation failed: {}", e)))?;

        // Generate unique filename and save to filesystem
        let unique_filename = image_utils::generate_unique_filename(&input.filename);
        let file_path = image_utils::save_image_file(app_handle, &image_data, &unique_filename)
            .map_err(|e| async_graphql::Error::new(format!("Failed to save image: {}", e)))?;

        // Create database record
        let id = Uuid::new_v4();
        let now = Utc::now();

        let image = Image {
            id,
            workspace_id: input.workspace_id,
            original_filename: input.filename.clone(),
            file_path: file_path.to_string_lossy().to_string(),
            mime_type: metadata.mime_type.clone(),
            file_size: metadata.file_size as i64,
            width: metadata.width.map(|w| w as i32),
            height: metadata.height.map(|h| h as i32),
            alt_text: input.alt_text.clone(),
            created_at: now,
            updated_at: now,
        };

        sqlx::query("INSERT INTO images (id, workspace_id, original_filename, file_path, mime_type, file_size, width, height, alt_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&image.id)
            .bind(&image.workspace_id)
            .bind(&image.original_filename)
            .bind(&image.file_path)
            .bind(&image.mime_type)
            .bind(&image.file_size)
            .bind(&image.width)
            .bind(&image.height)
            .bind(&image.alt_text)
            .bind(&image.created_at)
            .bind(&image.updated_at)
            .execute(pool)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(image)
    }

    async fn delete_image(&self, ctx: &Context<'_>, id: Uuid) -> Result<bool> {
        let pool = ctx.data::<SqlitePool>()?;

        // Get image record to find file path
        let image: Option<Image> = sqlx::query_as("SELECT * FROM images WHERE id = ?")
            .bind(&id)
            .fetch_optional(pool)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        if let Some(image) = image {
            // Delete from filesystem
            let _ = image_utils::delete_image_file(&image.file_path);

            // Delete from database
            sqlx::query("DELETE FROM images WHERE id = ?")
                .bind(&id)
                .execute(pool)
                .await
                .map_err(|e| async_graphql::Error::new(e.to_string()))?;

            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// GraphQL Schema type
pub type LoveNoteSchema = Schema<Query, Mutation, async_graphql::EmptySubscription>;

// Schema builder function with DataLoaders and SqlitePool
pub fn create_schema_with_loaders(
    pool: SqlitePool,
    app_handle: tauri::AppHandle,
) -> LoveNoteSchema {
    Schema::build(Query, Mutation, async_graphql::EmptySubscription)
        .data(DataLoader::new(UserLoader::new(pool.clone()), tokio::spawn))
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
        .data(DataLoader::new(
            ImageLoader::new(pool.clone()),
            tokio::spawn,
        ))
        .data(DataLoader::new(
            ImageByIdLoader::new(pool.clone()),
            tokio::spawn,
        ))
        .data(pool)
        .data(app_handle)
        .finish()
}

// Schema builder function without DataLoaders for SDL export
pub fn create_schema_for_sdl() -> LoveNoteSchema {
    Schema::build(Query, Mutation, async_graphql::EmptySubscription).finish()
}
