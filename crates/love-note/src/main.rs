use std::sync::Arc;

use gpui::*;
use gpui_component::{
    theme::{Theme, ThemeMode},
    Root,
};
use love_note::{LoveNote, Storage};

fn main() {
    Application::new()
        .with_assets(gpui_component_assets::Assets)
        .run(|cx: &mut App| {
            gpui_component::init(cx);
            // Force dark mode
            Theme::change(ThemeMode::Dark, None, cx);

            // Initialize storage
            let storage = Arc::new(
                Storage::open().expect("Failed to open database")
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
                    let storage = storage.clone();
                    let view = cx.new(|cx| LoveNote::new(storage, window, cx));
                    cx.new(|cx| Root::new(view, window, cx))
                },
            )
            .unwrap();
        });
}
