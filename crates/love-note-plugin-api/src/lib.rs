//! Plugin API types for Love Note
//!
//! This crate defines the types and traits that plugins use to interact
//! with the Love Note editor.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A block in the document.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: Uuid,
    pub kind: String,
    pub content: serde_json::Value,
}

/// Declarative UI element that plugins return for rendering.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Element {
    Text(TextElement),
    Heading(HeadingElement),
    Paragraph(ParagraphElement),
    Input(InputElement),
    Button(ButtonElement),
    Row { children: Vec<Element> },
    Column { children: Vec<Element> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextElement {
    pub content: String,
    #[serde(default)]
    pub bold: bool,
    #[serde(default)]
    pub italic: bool,
    #[serde(default)]
    pub code: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeadingElement {
    pub level: u8,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParagraphElement {
    pub content: String,
    #[serde(default)]
    pub editable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputElement {
    pub id: String,
    pub value: String,
    pub placeholder: Option<String>,
    #[serde(default)]
    pub multiline: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ButtonElement {
    pub id: String,
    pub label: String,
    #[serde(default)]
    pub style: ButtonStyle,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ButtonStyle {
    #[default]
    Primary,
    Secondary,
    Danger,
}

/// Events sent from host to plugin.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum BlockEvent {
    InputChanged { input_id: String, value: String },
    ButtonClicked { button_id: String },
    FocusChanged { focused: bool },
}

/// Plugin response to events.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BlockUpdate {
    pub content: Option<serde_json::Value>,
}

/// Plugin metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub block_kinds: Vec<BlockKindInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockKindInfo {
    pub kind: String,
    pub name: String,
    pub icon: Option<String>,
    pub description: Option<String>,
}
