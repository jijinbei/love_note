use std::sync::Arc;

use gpui::*;

use crate::workspace::{ExperimentInfo, Workspace};

/// Callback when an experiment is selected.
pub type OnSelect = Box<dyn Fn(&ExperimentInfo, &mut Window, &mut App) + 'static>;
/// Callback when "New Experiment" is clicked.
pub type OnNew = Box<dyn Fn(&mut Window, &mut App) + 'static>;

/// Sidebar listing experiments in the workspace.
pub struct ExperimentList {
    experiments: Vec<ExperimentInfo>,
    workspace: Arc<Workspace>,
    on_select: Option<OnSelect>,
    on_new: Option<OnNew>,
    selected_slug: Option<String>,
}

impl ExperimentList {
    pub fn new(workspace: Arc<Workspace>) -> Self {
        let experiments = workspace.list_experiments().unwrap_or_default();
        Self {
            experiments,
            workspace,
            on_select: None,
            on_new: None,
            selected_slug: None,
        }
    }

    pub fn set_on_select(&mut self, cb: OnSelect) {
        self.on_select = cb.into();
    }

    pub fn set_on_new(&mut self, cb: OnNew) {
        self.on_new = cb.into();
    }

    pub fn set_selected(&mut self, slug: &str) {
        self.selected_slug = Some(slug.to_string());
    }

    pub fn refresh(&mut self) {
        self.experiments = self.workspace.list_experiments().unwrap_or_default();
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

            row = row.on_click(cx.listener(move |this, _event, window, cx| {
                this.selected_slug = Some(info.slug.clone());
                if let Some(cb) = &this.on_select {
                    cb(&info, window, cx);
                }
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
                            .on_click(cx.listener(|this, _event, window, cx| {
                                if let Some(cb) = &this.on_new {
                                    cb(window, cx);
                                }
                                this.refresh();
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
