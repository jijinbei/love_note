use std::sync::Arc;

use gpui::*;
use gpui_component::{
    theme::{Theme, ThemeMode},
    Root,
};
use love_note::{Storage, Workspace, WorkspaceView};
use tracing_subscriber::EnvFilter;

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    tracing::info!("Love Note starting");

    Application::new()
        .with_assets(gpui_component_assets::Assets)
        .run(|cx: &mut App| {
            gpui_component::init(cx);
            love_note::typst_editor::init(cx);
            love_note::experiment_list::init(cx);
            Theme::change(ThemeMode::Dark, None, cx);

            let storage = Arc::new(
                Storage::open().expect("Failed to open database"),
            );
            let workspace = Arc::new(
                Workspace::open().expect("Failed to open workspace"),
            );

            let bounds = Bounds::centered(None, size(px(1200.0), px(800.0)), cx);
            cx.open_window(
                WindowOptions {
                    window_bounds: Some(WindowBounds::Windowed(bounds)),
                    is_minimizable: true,
                    is_movable: true,
                    is_resizable: true,
                    window_min_size: Some(size(px(600.0), px(400.0))),
                    ..Default::default()
                },
                |window, cx| {
                    let view = cx.new(|cx| {
                        WorkspaceView::new(storage, workspace, window, cx)
                    });
                    cx.new(|cx| Root::new(view, window, cx))
                },
            )
            .unwrap();

            tracing::info!("Window opened");
        });
}
