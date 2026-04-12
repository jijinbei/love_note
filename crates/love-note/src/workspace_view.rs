use std::sync::Arc;

use gpui::*;
use gpui::ExternalPaths;

use crate::experiment_list::ExperimentList;
use crate::export;
use crate::preview::Preview;
use crate::storage::Storage;
use crate::typst_editor::TypstEditor;
use crate::workspace::Workspace;

/// Top-level three-pane layout: title bar | sidebar | editor | preview | status bar.
pub struct WorkspaceView {
    sidebar: Entity<ExperimentList>,
    editor: Entity<TypstEditor>,
    preview: Entity<Preview>,
    workspace: Arc<Workspace>,
    status_message: String,
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
        let sidebar = cx.new(|_cx| ExperimentList::new(workspace.clone()));

        // When sidebar changes (selection or new experiment), load the selected experiment
        let editor_handle = editor.clone();
        let preview_for_sidebar = preview.clone();
        let ws = workspace.clone();
        let last_slug: std::cell::RefCell<Option<String>> = std::cell::RefCell::new(None);
        cx.observe(&sidebar, move |_this, sidebar, cx| {
            let selected = sidebar.read(cx).selected_slug().cloned();
            if let Some(ref slug) = selected {
                let mut last = last_slug.borrow_mut();
                if last.as_deref() != Some(slug) {
                    *last = Some(slug.clone());
                    if let Ok(content) = ws.read_experiment(slug) {
                        let slug_owned = slug.clone();
                        let root_dir = ws.root_dir().join(slug);
                        editor_handle.update(cx, |editor, _cx| {
                            editor.set_content(&content);
                            editor.set_current_experiment(slug_owned);
                        });
                        preview_for_sidebar.update(cx, |preview, cx| {
                            preview.set_root_dir(root_dir);
                            cx.notify();
                        });
                    }
                }
            }
        })
        .detach();

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
                if let Ok(content) = workspace.read_experiment(&slug) {
                    let root_dir = workspace.root_dir().join(&slug);
                    editor.update(cx, |editor, _cx| {
                        editor.set_content(&content);
                        editor.set_current_experiment(slug.clone());
                    });
                    preview.update(cx, |preview, cx| {
                        preview.set_root_dir(root_dir);
                        cx.notify();
                    });
                }
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
            status_message: "Ready".to_string(),
        }
    }
}

impl WorkspaceView {
    fn export_current_pdf(&mut self, cx: &mut Context<Self>) {
        let content = self.editor.read(cx).input_text(cx);
        let experiment = self.editor.read(cx).current_experiment().map(|s| s.to_string());

        if content.trim().is_empty() {
            self.status_message = "Nothing to export".to_string();
            cx.notify();
            return;
        }

        let output_dir = self.workspace.root_dir().join("../exports");
        let filename = experiment
            .as_deref()
            .unwrap_or("untitled");
        let output_path = output_dir.join(format!("{}.pdf", filename));

        match export::export_pdf(&content, &output_path) {
            Ok(path) => {
                self.status_message = format!("PDF exported: {}", path.display());
                tracing::info!(path = %path.display(), "PDF exported");
            }
            Err(e) => {
                self.status_message = format!("Export failed: {}", e);
                tracing::error!(error = %e, "PDF export failed");
            }
        }
        cx.notify();
    }

    fn handle_file_drop(&mut self, paths: &[std::path::PathBuf], cx: &mut Context<Self>) {
        let Some(experiment) = self.editor.read(cx).current_experiment().map(|s| s.to_string()) else {
            self.status_message = "No experiment selected".to_string();
            cx.notify();
            return;
        };

        let mut added_images = Vec::new();

        for path in paths {
            match self.workspace.add_file_to_experiment(&experiment, path) {
                Ok(filename) => {
                    let is_image = matches!(
                        path.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()).as_deref(),
                        Some("png" | "jpg" | "jpeg" | "gif" | "tiff" | "tif" | "bmp" | "webp" | "svg")
                    );
                    if is_image {
                        added_images.push(filename);
                    }
                    tracing::info!(file = %path.display(), "File dropped into experiment");
                }
                Err(e) => {
                    tracing::error!(error = %e, file = %path.display(), "Failed to add dropped file");
                }
            }
        }

        // Insert Typst code for images
        if !added_images.is_empty() {
            let typst_code: String = added_images
                .iter()
                .map(|f| crate::image_capture::pipeline::typst_figure_code(f, ""))
                .collect::<Vec<_>>()
                .join("\n");

            self.editor.update(cx, |editor, _cx| {
                let current = editor.input_text(_cx);
                let new_content = format!("{}\n{}", current, typst_code);
                editor.set_content(&new_content);
            });
        }

        self.status_message = format!("{} file(s) added", paths.len());

        // Refresh sidebar to show new files
        self.sidebar.update(cx, |list, cx| {
            list.refresh();
            cx.notify();
        });

        cx.notify();
    }
}

impl Render for WorkspaceView {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .size_full()
            .flex()
            .flex_col()
            .on_drop(cx.listener(|this, paths: &ExternalPaths, _window, cx| {
                this.handle_file_drop(paths.paths(), cx);
            }))
            .child(
                // Title bar with close button
                div()
                    .h(px(32.0))
                    .w_full()
                    .px_4()
                    .flex()
                    .items_center()
                    .justify_between()
                    .bg(rgb(0x181825))
                    .border_b_1()
                    .border_color(rgb(0x333333))
                    .child(
                        div()
                            .text_sm()
                            .text_color(rgb(0xaaaaaa))
                            .child("Love Note"),
                    )
                    .child(
                        // Window control buttons
                        div()
                            .flex()
                            .flex_row()
                            .gap_1()
                            .child(
                                // Minimize button
                                div()
                                    .id("minimize-btn")
                                    .w(px(28.0))
                                    .h(px(20.0))
                                    .flex()
                                    .items_center()
                                    .justify_center()
                                    .rounded_sm()
                                    .cursor_pointer()
                                    .text_xs()
                                    .text_color(rgb(0x888888))
                                    .hover(|s| s.bg(rgb(0x444466)).text_color(rgb(0xffffff)))
                                    .child("\u{2014}") // — (em dash, standard minimize icon)
                                    .on_click(|_event, window, _cx| {
                                        window.minimize_window();
                                    }),
                            )
                            .child(
                                // Maximize button
                                div()
                                    .id("maximize-btn")
                                    .w(px(28.0))
                                    .h(px(20.0))
                                    .flex()
                                    .items_center()
                                    .justify_center()
                                    .rounded_sm()
                                    .cursor_pointer()
                                    .text_xs()
                                    .text_color(rgb(0x888888))
                                    .hover(|s| s.bg(rgb(0x444466)).text_color(rgb(0xffffff)))
                                    .child("\u{25a1}") // □ (white square, standard maximize icon)
                                    .on_click(|_event, window, _cx| {
                                        window.zoom_window();
                                    }),
                            )
                            .child(
                                // Close button
                                div()
                                    .id("close-btn")
                                    .w(px(28.0))
                                    .h(px(20.0))
                                    .flex()
                                    .items_center()
                                    .justify_center()
                                    .rounded_sm()
                                    .cursor_pointer()
                                    .text_sm()
                                    .text_color(rgb(0x888888))
                                    .hover(|s| s.bg(rgb(0xcc4444)).text_color(rgb(0xffffff)))
                                    .child("x")
                                    .on_click(cx.listener(|_this, _event, _window, cx| {
                                        cx.quit();
                                    })),
                            ),
                    ),
            )
            .child(
                // Main content: sidebar | editor | preview
                div()
                    .flex_1()
                    .flex()
                    .flex_row()
                    .overflow_hidden()
                    .child(
                        div()
                            .w(px(200.0))
                            .h_full()
                            .border_r_1()
                            .border_color(rgb(0x333333))
                            .child(self.sidebar.clone()),
                    )
                    .child(
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
                        div()
                            .flex_1()
                            .h_full()
                            .min_w(px(200.0))
                            .overflow_hidden()
                            .child(self.preview.clone()),
                    ),
            )
            .child({
                // Status bar
                let is_dirty = self.editor.read(cx).is_dirty(cx);
                let experiment_name = self.editor.read(cx)
                    .current_experiment()
                    .map(|s| s.to_string())
                    .unwrap_or_default();

                let save_indicator = if is_dirty {
                    div()
                        .flex()
                        .items_center()
                        .gap_1()
                        .child(
                            div()
                                .w(px(8.0))
                                .h(px(8.0))
                                .rounded_full()
                                .bg(rgb(0xeeaa44)),
                        )
                        .child("Unsaved changes")
                        .text_color(rgb(0xeeaa44))
                        .into_any_element()
                } else {
                    div()
                        .flex()
                        .items_center()
                        .gap_1()
                        .child(
                            div()
                                .w(px(8.0))
                                .h(px(8.0))
                                .rounded_full()
                                .bg(rgb(0x44aa66)),
                        )
                        .child("Saved")
                        .text_color(rgb(0x44aa66))
                        .into_any_element()
                };

                div()
                    .h(px(28.0))
                    .flex_shrink_0()
                    .w_full()
                    .px_4()
                    .flex()
                    .items_center()
                    .justify_between()
                    .bg(rgb(0x1e1e2e))
                    .border_t_1()
                    .border_color(rgb(0x333333))
                    .text_size(px(12.0))
                    .text_color(rgb(0x888888))
                    .child(
                        // Left: save indicator + experiment name
                        div()
                            .flex()
                            .items_center()
                            .gap_3()
                            .child(save_indicator)
                            .child(
                                div()
                                    .text_color(rgb(0x888888))
                                    .child(experiment_name),
                            )
                            .child(
                                div()
                                    .text_color(rgb(0x666666))
                                    .child(self.status_message.clone()),
                            ),
                    )
                    .child(
                        // Right: Export PDF button
                        div()
                            .id("export-pdf-btn")
                            .px_2()
                            .rounded_sm()
                            .cursor_pointer()
                            .text_color(rgb(0x88aacc))
                            .hover(|s| s.bg(rgb(0x2a2a3a)).text_color(rgb(0xaaccee)))
                            .child("Export PDF")
                            .on_click(cx.listener(|this, _event, _window, cx| {
                                this.export_current_pdf(cx);
                            })),
                    )
            })
    }
}
