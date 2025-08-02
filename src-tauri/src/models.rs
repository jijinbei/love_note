use serde::{Deserialize, Serialize};
use async_graphql::{SimpleObject, InputObject};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// Hierarchical models
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase")]
pub struct Workspace {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase")]
pub struct Project {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject, sqlx::FromRow)]
#[graphql(rename_fields = "camelCase")]
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

// Block content types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum BlockContent {
    NoteBlock { text: String },
    SampleRefBlock { sample_id: Uuid },
    ProtocolRefBlock { protocol_id: Uuid },
    ImageBlock { path: String, alt: String },
    TableBlock { headers: Vec<String>, rows: Vec<Vec<String>> },
}

// Master data models
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
#[graphql(rename_fields = "camelCase")]
pub struct Sample {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub name: String,
    pub properties: String, // JSON serialized properties
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
#[graphql(rename_fields = "camelCase")]
pub struct Protocol {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub name: String,
    pub steps: String, // JSON serialized steps
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Request types for new models
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
    pub content: BlockContent,
    pub order_index: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateBlockRequest {
    pub content: BlockContent,
    pub order_index: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSampleRequest {
    pub workspace_id: Uuid,
    pub name: String,
    pub properties: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProtocolRequest {
    pub workspace_id: Uuid,
    pub name: String,
    pub steps: Vec<String>,
}

// GraphQL-specific input types for complex cases
#[derive(Debug, Serialize, Deserialize, InputObject)]
pub struct CreateBlockInput {
    pub experiment_id: Uuid,
    pub block_type: String,
    pub content: String, // JSON string representation of BlockContent
    pub order_index: i32,
}

impl CreateBlockInput {
    pub fn to_request(self) -> Result<CreateBlockRequest, serde_json::Error> {
        let content: BlockContent = serde_json::from_str(&self.content)?;
        Ok(CreateBlockRequest {
            experiment_id: self.experiment_id,
            block_type: self.block_type,
            content,
            order_index: self.order_index,
        })
    }
}