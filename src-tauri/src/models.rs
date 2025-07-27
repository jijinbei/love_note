use serde::{Deserialize, Serialize};

// Hierarchical models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Experiment {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    pub experiment_id: String,
    pub block_type: String,
    pub content: String, // JSON serialized BlockContent
    pub order_index: i32,
    pub created_at: String,
    pub updated_at: String,
}

// Block content types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum BlockContent {
    NoteBlock { text: String },
    SampleRefBlock { sample_id: String },
    ProtocolRefBlock { protocol_id: String },
    ImageBlock { path: String, alt: String },
    TableBlock { headers: Vec<String>, rows: Vec<Vec<String>> },
}

// Master data models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sample {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub properties: String, // JSON serialized properties
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Protocol {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub steps: String, // JSON serialized steps
    pub created_at: String,
    pub updated_at: String,
}

// Request types for new models
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateWorkspaceRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub workspace_id: String,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateExperimentRequest {
    pub project_id: String,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBlockRequest {
    pub experiment_id: String,
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
    pub workspace_id: String,
    pub name: String,
    pub properties: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProtocolRequest {
    pub workspace_id: String,
    pub name: String,
    pub steps: Vec<String>,
}