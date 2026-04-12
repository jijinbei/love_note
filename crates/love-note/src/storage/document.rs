use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A Typst document stored in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypstDocument {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub frontmatter: serde_json::Value,
    pub locked: bool,
    pub locked_by: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl TypstDocument {
    pub fn new(title: &str) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            title: title.to_string(),
            content: String::new(),
            frontmatter: serde_json::Value::Object(Default::default()),
            locked: false,
            locked_by: None,
            created_at: now,
            updated_at: now,
        }
    }
}
