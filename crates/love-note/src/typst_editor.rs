use std::sync::Arc;

use gpui::*;
use gpui_component::input::{Input, InputState};

use crate::storage::{Storage, TypstDocument};
use crate::workspace::Workspace;

pub struct TypstEditor {
    document: TypstDocument,
    input: Entity<InputState>,
    storage: Arc<Storage>,
    workspace: Arc<Workspace>,
    /// Current experiment directory name (e.g., "2026-04-13_pcr-experiment")
    current_experiment: Option<String>,
}

impl TypstEditor {
    pub fn new(
        storage: Arc<Storage>,
        workspace: Arc<Workspace>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let document = storage
            .get_or_create_default()
            .expect("Failed to load document");

        let content = document.content.clone();
        let input = cx.new(|cx| {
            let mut state = InputState::new(window, cx)
                .multi_line(true)
                .soft_wrap(true)
                .placeholder("Type Typst source here...");
            state.set_value(content, window, cx);
            state
        });

        tracing::info!(doc_id = %document.id, title = %document.title, "Document loaded");

        // Notify observers when input changes (for preview updates)
        cx.observe(&input, |_this, _input, cx| {
            cx.notify();
        })
        .detach();

        Self {
            document,
            input,
            storage,
            workspace,
            current_experiment: None,
        }
    }

    /// Get the current text from the input state.
    pub fn input_text(&self, cx: &App) -> String {
        self.input.read(cx).value().to_string()
    }

    /// Load an experiment's main.typ into the editor.
    pub fn load_experiment(
        &mut self,
        slug: &str,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        match self.workspace.read_experiment(slug) {
            Ok(content) => {
                self.document.content = content.clone();
                self.document.title = slug.to_string();
                self.current_experiment = Some(slug.to_string());
                self.input.update(cx, |state, cx| {
                    state.set_value(content, window, cx);
                });
                tracing::info!(experiment = slug, "Experiment loaded");
                cx.notify();
            }
            Err(e) => {
                tracing::error!(error = %e, experiment = slug, "Failed to load experiment");
            }
        }
    }

    pub fn save_document(&mut self, _window: &mut Window, cx: &mut Context<Self>) {
        let content = self.input.read(cx).value().to_string();
        self.document.content = content.clone();
        self.document.updated_at = chrono::Utc::now();

        // Save to redb
        match self.storage.save_document(&self.document) {
            Ok(()) => tracing::debug!(doc_id = %self.document.id, "Document saved to redb"),
            Err(e) => tracing::error!(error = %e, "Failed to save to redb"),
        }

        // Save to workspace .typ file
        if let Some(ref exp) = self.current_experiment {
            match self.workspace.write_experiment(exp, &content) {
                Ok(()) => tracing::info!(experiment = %exp, "Saved to .typ file"),
                Err(e) => tracing::error!(error = %e, "Failed to save .typ file"),
            }
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
                    .child(
                        Input::new(&self.input)
                            .cleanable(false)
                            .appearance(false)
                            .h_full(),
                    ),
            )
    }
}

actions!(typst_editor, [Save]);

pub fn init(cx: &mut App) {
    cx.bind_keys([KeyBinding::new("ctrl-s", Save, Some("TypstEditor"))]);
}
