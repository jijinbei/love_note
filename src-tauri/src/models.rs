use async_graphql::{InputObject, SimpleObject};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// User model
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase")]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub display_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Hierarchical models
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase", complex)]
pub struct Workspace {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase", complex)]
pub struct Project {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase", complex)]
pub struct Experiment {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase")]
pub struct Block {
    pub id: Uuid,
    pub experiment_id: Uuid,
    pub block_type: String,
    pub content: String, // JSON serialized BlockContent
    pub order_index: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Image model
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase", complex)]
pub struct Image {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub original_filename: String,
    pub file_path: String,
    pub mime_type: String,
    pub file_size: i64,
    pub alt_text: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Plugin model
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase")]
pub struct Plugin {
    pub id: Uuid,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub source_code: String,
    pub is_enabled: bool,
    pub installed_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request types for new models
#[derive(Debug, Serialize, Deserialize, InputObject)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub display_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, InputObject)]
pub struct CreateWorkspaceRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, InputObject)]
pub struct CreateProjectRequest {
    pub workspace_id: Uuid,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, InputObject)]
pub struct CreateExperimentRequest {
    pub project_id: Uuid,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBlockRequest {
    pub experiment_id: Uuid,
    pub block_type: String,
    pub content: serde_json::Value, // 任意のJSON構造を許可
    pub order_index: i32,
}

#[derive(Debug, Serialize, Deserialize, InputObject)]
pub struct UpdateBlockInput {
    pub content: String, // JSON string representation of BlockContent
    pub order_index: Option<i32>,
}

impl UpdateBlockInput {
    pub fn to_request(self) -> Result<UpdateBlockRequest, serde_json::Error> {
        let content: serde_json::Value = serde_json::from_str(&self.content)?;
        Ok(UpdateBlockRequest {
            content,
            order_index: self.order_index,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateBlockRequest {
    pub content: serde_json::Value, // 任意のJSON構造を許可
    pub order_index: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateImageRequest {
    pub workspace_id: Uuid,
    pub original_filename: String,
    pub file_path: String,
    pub mime_type: String,
    pub file_size: i64,
    pub alt_text: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, InputObject)]
pub struct ImageUploadInput {
    pub workspace_id: Uuid,
    pub filename: String,
    pub data: String, // Base64 encoded image data
    pub alt_text: Option<String>,
}

/// GraphQL-specific input types for complex cases
#[derive(Debug, Serialize, Deserialize, InputObject)]
pub struct CreateBlockInput {
    pub experiment_id: Uuid,
    pub block_type: String,
    pub content: String, // JSON string representation of BlockContent
    pub order_index: i32,
}

impl CreateBlockInput {
    pub fn to_request(self) -> Result<CreateBlockRequest, serde_json::Error> {
        let content: serde_json::Value = serde_json::from_str(&self.content)?;
        Ok(CreateBlockRequest {
            experiment_id: self.experiment_id,
            block_type: self.block_type,
            content,
            order_index: self.order_index,
        })
    }
}

/// Plugin request types
#[derive(Debug, Serialize, Deserialize, InputObject)]
pub struct InstallPluginInput {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub source_code: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePluginRequest {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub source_code: String,
}

impl From<InstallPluginInput> for CreatePluginRequest {
    fn from(input: InstallPluginInput) -> Self {
        Self {
            name: input.name,
            version: input.version,
            description: input.description,
            author: input.author,
            source_code: input.source_code,
        }
    }
}
