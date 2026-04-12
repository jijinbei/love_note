use std::sync::Arc;

use gpui::*;
use gpui_component::input::{Input, InputState};

use crate::storage::{Storage, TypstDocument};

pub struct TypstEditor {
    document: TypstDocument,
    input: Entity<InputState>,
    storage: Arc<Storage>,
}

impl TypstEditor {
    pub fn new(storage: Arc<Storage>, window: &mut Window, cx: &mut Context<Self>) -> Self {
        let document = storage
            .get_or_create_default()
            .expect("Failed to load document");

        let input = cx.new(|cx| {
            let mut state = InputState::new(window, cx);
            state.set_value(document.content.clone(), window, cx);
            state.set_placeholder("Type Typst source here...", window, cx);
            state
        });

        tracing::info!(doc_id = %document.id, title = %document.title, "Document loaded");

        Self {
            document,
            input,
            storage,
        }
    }

    pub fn save_document(&mut self, _window: &mut Window, cx: &mut Context<Self>) {
        let content = self.input.read(cx).value().to_string();
        self.document.content = content;
        self.document.updated_at = chrono::Utc::now();

        match self.storage.save_document(&self.document) {
            Ok(()) => tracing::info!(doc_id = %self.document.id, "Document saved"),
            Err(e) => tracing::error!(error = %e, "Failed to save document"),
        }
    }
}

impl Render for TypstEditor {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .size_full()
            .flex()
            .flex_col()
            .key_context("TypstEditor")
            .on_action(cx.listener(|this, _action: &Save, window, cx| {
                this.save_document(window, cx);
            }))
            .child(
                div()
                    .size_full()
                    .p_4()
                    .child(
                        Input::new(&self.input)
                            .cleanable(false)
                            .appearance(false)
                    ),
            )
    }
}

actions!(typst_editor, [Save]);

pub fn init(cx: &mut App) {
    cx.bind_keys([KeyBinding::new("ctrl-s", Save, Some("TypstEditor"))]);
}
