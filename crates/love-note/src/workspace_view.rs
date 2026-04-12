use std::sync::Arc;

use gpui::*;

use crate::experiment_list::ExperimentList;
use crate::preview::Preview;
use crate::storage::Storage;
use crate::typst_editor::TypstEditor;
use crate::workspace::Workspace;

/// Top-level three-pane layout: sidebar | editor | preview.
pub struct WorkspaceView {
    sidebar: Entity<ExperimentList>,
    editor: Entity<TypstEditor>,
    preview: Entity<Preview>,
    workspace: Arc<Workspace>,
}

impl WorkspaceView {
    pub fn new(
        storage: Arc<Storage>,
        workspace: Arc<Workspace>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let editor = cx.new(|cx| {
            TypstEditor::new(storage, workspace.clone(), window, cx)
        });
        let preview = cx.new(|_cx| Preview::new());

        // Create sidebar
        let sidebar = cx.new(|_cx| ExperimentList::new(workspace.clone()));

        // Wire up: selecting an experiment loads it in the editor
        let editor_handle = editor.clone();
        sidebar.update(cx, |list, _cx| {
            list.set_on_select(Box::new(move |info, window, cx| {
                editor_handle.update(cx, |editor, cx| {
                    editor.load_experiment(&info.slug, window, cx);
                });
            }));
        });

        // Wire up: "New" button creates an experiment and loads it
        let editor_handle = editor.clone();
        let ws = workspace.clone();
        let sidebar_handle = sidebar.clone();
        sidebar.update(cx, |list, _cx| {
            list.set_on_new(Box::new(move |window, cx| {
                match ws.create_experiment("New Experiment") {
                    Ok(path) => {
                        let slug = path
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("unknown")
                            .to_string();
                        editor_handle.update(cx, |editor, cx| {
                            editor.load_experiment(&slug, window, cx);
                        });
                        sidebar_handle.update(cx, |list, cx| {
                            list.refresh();
                            list.set_selected(&slug);
                            cx.notify();
                        });
                        tracing::info!(slug, "New experiment created");
                    }
                    Err(e) => {
                        tracing::error!(error = %e, "Failed to create experiment");
                    }
                }
            }));
        });

        // Observe editor changes and update preview
        let preview_handle = preview.clone();
        cx.observe(&editor, move |_this, editor, cx| {
            let content = editor.read(cx).input_text(cx);
            preview_handle.update(cx, |preview, cx| {
                preview.update_from_source(&content);
                cx.notify();
            });
        })
        .detach();

        // Initial preview render
        {
            let content = editor.read(cx).input_text(cx);
            preview.update(cx, |preview, cx| {
                preview.update_from_source(&content);
                cx.notify();
            });
        }

        // Load the first experiment if available
        {
            let experiments = workspace.list_experiments().unwrap_or_default();
            if let Some(first) = experiments.first() {
                let slug = first.slug.clone();
                editor.update(cx, |editor, cx| {
                    editor.load_experiment(&slug, window, cx);
                });
                sidebar.update(cx, |list, _cx| {
                    list.set_selected(&slug);
                });
            }
        }

        Self {
            sidebar,
            editor,
            preview,
            workspace,
        }
    }
}

impl Render for WorkspaceView {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .size_full()
            .flex()
            .flex_col()
            .child(
                // Main content: sidebar | editor | preview
                div()
                    .flex_1()
                    .flex()
                    .flex_row()
                    .child(
                        // Sidebar
                        div()
                            .w(px(200.0))
                            .h_full()
                            .border_r_1()
                            .border_color(rgb(0x333333))
                            .child(self.sidebar.clone()),
                    )
                    .child(
                        // Editor
                        div()
                            .flex_1()
                            .h_full()
                            .min_w(px(200.0))
                            .border_r_1()
                            .border_color(rgb(0x333333))
                            .overflow_hidden()
                            .child(self.editor.clone()),
                    )
                    .child(
                        // Preview
                        div()
                            .flex_1()
                            .h_full()
                            .min_w(px(200.0))
                            .overflow_hidden()
                            .child(self.preview.clone()),
                    ),
            )
            .child(
                // Status bar
                div()
                    .h(px(28.0))
                    .w_full()
                    .px_4()
                    .flex()
                    .items_center()
                    .bg(rgb(0x1e1e2e))
                    .border_t_1()
                    .border_color(rgb(0x333333))
                    .text_size(px(12.0))
                    .text_color(rgb(0x888888))
                    .child("Love Note — Typst ELN"),
            )
    }
}
