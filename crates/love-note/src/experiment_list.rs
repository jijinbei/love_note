use std::sync::Arc;

use gpui::*;
use gpui_component::input::InputState;
use gpui_component::menu::ContextMenuExt as _;

use crate::workspace::{ExperimentInfo, Workspace};

/// Event emitted when an experiment is selected.
pub struct ExperimentSelected {
    pub info: ExperimentInfo,
}

impl EventEmitter<ExperimentSelected> for ExperimentList {}

/// Event emitted when a new experiment is requested.
pub struct NewExperimentRequested;

impl EventEmitter<NewExperimentRequested> for ExperimentList {}

/// Sidebar listing experiments in the workspace.
pub struct ExperimentList {
    experiments: Vec<ExperimentInfo>,
    workspace: Arc<Workspace>,
    selected_slug: Option<String>,
    /// Slug of the experiment being renamed (inline editing).
    renaming_slug: Option<String>,
    /// Input state for the rename field.
    rename_input: Option<Entity<InputState>>,
    /// Slug that was right-clicked (for context menu target).
    context_menu_slug: Option<String>,
}

impl ExperimentList {
    pub fn new(workspace: Arc<Workspace>) -> Self {
        let experiments = workspace.list_experiments().unwrap_or_default();
        Self {
            experiments,
            workspace,
            selected_slug: None,
            renaming_slug: None,
            rename_input: None,
            context_menu_slug: None,
        }
    }

    pub fn selected_slug(&self) -> Option<&String> {
        self.selected_slug.as_ref()
    }

    pub fn set_selected(&mut self, slug: &str) {
        self.selected_slug = Some(slug.to_string());
    }

    pub fn refresh(&mut self) {
        self.experiments = self.workspace.list_experiments().unwrap_or_default();
    }

    /// Create a new experiment, refresh, select it, and return the slug.
    pub fn create_and_select(&mut self, name: &str) -> Option<String> {
        match self.workspace.create_experiment(name) {
            Ok(path) => {
                let slug = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();
                self.refresh();
                self.selected_slug = Some(slug.clone());
                tracing::info!(slug = %slug, "New experiment created");
                Some(slug)
            }
            Err(e) => {
                tracing::error!(error = %e, "Failed to create experiment");
                None
            }
        }
    }

    /// Start inline rename for an experiment.
    fn start_rename(&mut self, slug: &str, window: &mut Window, cx: &mut Context<Self>) {
        let current_name = slug
            .get(11..)
            .unwrap_or(slug)
            .replace('-', " ");

        let input = cx.new(|cx| {
            let mut state = InputState::new(window, cx)
                .placeholder("Experiment name...");
            state.set_value(current_name, window, cx);
            state
        });

        self.renaming_slug = Some(slug.to_string());
        self.rename_input = Some(input);
    }

    /// Commit the rename.
    fn commit_rename(&mut self, cx: &mut Context<Self>) {
        let Some(old_slug) = self.renaming_slug.take() else { return };
        let Some(input) = self.rename_input.take() else { return };

        let new_name = input.read(cx).value().to_string();
        if new_name.trim().is_empty() {
            return;
        }

        match self.workspace.rename_experiment(&old_slug, new_name.trim()) {
            Ok(new_slug) => {
                tracing::info!(old = %old_slug, new = %new_slug, "Experiment renamed");
                if self.selected_slug.as_deref() == Some(&old_slug) {
                    self.selected_slug = Some(new_slug);
                }
                self.refresh();
            }
            Err(e) => {
                tracing::error!(error = %e, "Failed to rename experiment");
            }
        }
    }

    /// Cancel the rename.
    fn cancel_rename(&mut self) {
        self.renaming_slug = None;
        self.rename_input = None;
    }
}

impl Render for ExperimentList {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let mut list = div().flex().flex_col().gap_1();

        for exp in &self.experiments {
            let slug = exp.slug.clone();
            let is_selected = self.selected_slug.as_deref() == Some(&slug);
            let info = exp.clone();
            let is_renaming = self.renaming_slug.as_deref() == Some(&slug);

            let date_str = exp
                .date
                .map(|d| d.format("%m/%d").to_string())
                .unwrap_or_default();

            let name = slug
                .get(11..)
                .unwrap_or(&slug)
                .replace('-', " ");

            let name_element: AnyElement = if is_renaming {
                if let Some(ref input) = self.rename_input {
                    div()
                        .w_full()
                        .child(
                            gpui_component::input::Input::new(input)
                                .cleanable(false)
                                .appearance(true),
                        )
                        .into_any_element()
                } else {
                    div().child(name).into_any_element()
                }
            } else {
                div()
                    .text_ellipsis()
                    .overflow_hidden()
                    .child(name)
                    .into_any_element()
            };

            let mut row = div()
                .id(ElementId::Name(slug.clone().into()))
                .px_2()
                .py_1()
                .rounded_md()
                .cursor_pointer()
                .text_sm()
                .w_full()
                .child(
                    div()
                        .flex()
                        .flex_col()
                        .overflow_hidden()
                        .child(name_element)
                        .child(
                            div()
                                .text_xs()
                                .text_color(rgb(0x888888))
                                .child(date_str),
                        ),
                );

            if is_selected {
                row = row.bg(rgb(0x333355));
            } else {
                row = row.hover(|s| s.bg(rgb(0x2a2a3a)));
            }

            if is_renaming {
                list = list.child(row);
            } else {
                let ctx_slug = slug.clone();
                let row_with_menu = row
                    .on_click(cx.listener(move |this, _event, _window, cx| {
                        this.selected_slug = Some(info.slug.clone());
                        cx.emit(ExperimentSelected { info: info.clone() });
                        cx.notify();
                    }))
                    .on_mouse_down(
                        MouseButton::Right,
                        cx.listener(move |this, _event: &MouseDownEvent, _window, _cx| {
                            this.context_menu_slug = Some(ctx_slug.clone());
                        }),
                    )
                    .context_menu(move |menu, _window, _cx| {
                        menu.menu("Rename", StartRename.boxed_clone())
                    });
                list = list.child(row_with_menu);
            }
        }

        div()
            .size_full()
            .flex()
            .flex_col()
            .bg(rgb(0x181825))
            .key_context("ExperimentList")
            .on_action(cx.listener(|this, _action: &StartRename, window, cx| {
                if let Some(slug) = this.context_menu_slug.take() {
                    this.start_rename(&slug, window, cx);
                    cx.notify();
                }
            }))
            .on_action(cx.listener(|this, _action: &ConfirmRename, _window, cx| {
                this.commit_rename(cx);
                cx.notify();
            }))
            .on_action(cx.listener(|this, _action: &CancelRename, _window, cx| {
                this.cancel_rename();
                cx.notify();
            }))
            .child(
                div()
                    .px_2()
                    .py_2()
                    .flex()
                    .items_center()
                    .justify_between()
                    .child(
                        div()
                            .text_sm()
                            .font_weight(FontWeight::BOLD)
                            .text_color(rgb(0xaaaaaa))
                            .child("Experiments"),
                    )
                    .child(
                        div()
                            .id("new-experiment-btn")
                            .px_2()
                            .py_1()
                            .rounded_md()
                            .cursor_pointer()
                            .text_sm()
                            .text_color(rgb(0x88cc88))
                            .hover(|s| s.bg(rgb(0x2a2a3a)))
                            .child("+ New")
                            .on_click(cx.listener(|this, _event, _window, cx| {
                                this.create_and_select("New Experiment");
                                cx.emit(NewExperimentRequested);
                                cx.notify();
                            })),
                    ),
            )
            .child(
                div()
                    .flex_1()
                    .px_1()
                    .py_1()
                    .child(list),
            )
    }
}

actions!(experiment_list, [StartRename, ConfirmRename, CancelRename]);

pub fn init(cx: &mut App) {
    cx.bind_keys([
        KeyBinding::new("enter", ConfirmRename, Some("ExperimentList")),
        KeyBinding::new("escape", CancelRename, Some("ExperimentList")),
    ]);
}
