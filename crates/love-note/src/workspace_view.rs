use std::sync::Arc;

use gpui::*;

use crate::experiment_list::ExperimentList;
use crate::preview::Preview;
use crate::storage::Storage;
use crate::typst_editor::TypstEditor;
use crate::workspace::Workspace;

/// Top-level three-pane layout: title bar | sidebar | editor | preview | status bar.
pub struct WorkspaceView {
    sidebar: Entity<ExperimentList>,
    editor: Entity<TypstEditor>,
    preview: Entity<Preview>,
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
                        editor_handle.update(cx, |editor, _cx| {
                            editor.set_content(&content);
                            editor.set_current_experiment(slug_owned);
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
                    editor.update(cx, |editor, _cx| {
                        editor.set_content(&content);
                        editor.set_current_experiment(slug.clone());
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
        }
    }
}

impl Render for WorkspaceView {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .size_full()
            .flex()
            .flex_col()
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
