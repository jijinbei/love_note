use std::sync::Arc;

use gpui::*;

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
}

impl ExperimentList {
    pub fn new(workspace: Arc<Workspace>) -> Self {
        let experiments = workspace.list_experiments().unwrap_or_default();
        Self {
            experiments,
            workspace,
            selected_slug: None,
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
}

impl Render for ExperimentList {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let mut list = div().flex().flex_col().gap_1();

        for exp in &self.experiments {
            let slug = exp.slug.clone();
            let is_selected = self.selected_slug.as_deref() == Some(&slug);
            let info = exp.clone();

            let date_str = exp
                .date
                .map(|d| d.format("%m/%d").to_string())
                .unwrap_or_default();

            // Extract name part after date prefix
            let name = slug
                .get(11..)
                .unwrap_or(&slug)
                .replace('-', " ");

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
                        .child(
                            div()
                                .text_ellipsis()
                                .overflow_hidden()
                                .child(name),
                        )
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

            row = row.on_click(cx.listener(move |this, _event, _window, cx| {
                this.selected_slug = Some(info.slug.clone());
                cx.emit(ExperimentSelected { info: info.clone() });
                cx.notify();
            }));

            list = list.child(row);
        }

        div()
            .size_full()
            .flex()
            .flex_col()
            .bg(rgb(0x181825))
            .child(
                // Header with New button
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
                // Experiment list
                div()
                    .flex_1()
                    .px_1()
                    .py_1()
                    .child(list),
            )
    }
}
