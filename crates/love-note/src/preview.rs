use std::path::PathBuf;
use std::sync::Arc;

use gpui::*;
use gpui_component::scroll::ScrollableElement;

use crate::typst_world::LoveNoteWorld;

/// Preview component that renders Typst output as images.
pub struct Preview {
    /// The rendered page images, if compilation succeeded.
    rendered_pages: Vec<Arc<RenderImage>>,
    /// Error message from the last failed compilation.
    error_message: Option<String>,
    /// Cached world (reuse fonts across compilations).
    world: Option<LoveNoteWorld>,
    /// Last compiled source (avoid redundant recompilations).
    last_source: String,
    /// Root directory for file resolution.
    root_dir: Option<PathBuf>,
}

impl Preview {
    pub fn new() -> Self {
        Self {
            rendered_pages: Vec::new(),
            error_message: None,
            world: None,
            last_source: String::new(),
            root_dir: None,
        }
    }

    /// Set the root directory for file resolution (experiment directory).
    pub fn set_root_dir(&mut self, dir: PathBuf) {
        self.root_dir = Some(dir);
        // Force recompilation
        self.last_source.clear();
    }

    /// Compile the given source and update the preview.
    /// Skips compilation if the source hasn't changed.
    pub fn update_from_source(&mut self, source: &str) {
        if source == self.last_source {
            return;
        }
        self.last_source = source.to_string();

        // Reuse world (fonts are expensive to load)
        let world = self.world.get_or_insert_with(|| {
            tracing::info!("Initializing Typst world (loading fonts)");
            LoveNoteWorld::new(source)
        });
        world.set_source(source);

        // Update root dir for file resolution
        if let Some(ref dir) = self.root_dir {
            world.set_root_dir(dir.clone());
        }

        let result = typst::compile::<typst::layout::PagedDocument>(world);

        match result.output {
            Ok(document) => {
                let mut pages = Vec::new();
                for page in &document.pages {
                    let pixmap = typst_render::render(page, 2.0);
                    let width = pixmap.width();
                    let height = pixmap.height();
                    let data = pixmap.take();

                    if let Some(image_buffer) =
                        image::RgbaImage::from_raw(width, height, data)
                    {
                        let frame = image::Frame::new(image_buffer);
                        let render_image = RenderImage::new(vec![frame]);
                        pages.push(Arc::new(render_image));
                    }
                }
                if !pages.is_empty() {
                    self.rendered_pages = pages;
                    self.error_message = None;
                    tracing::debug!(page_count = self.rendered_pages.len(), "Preview rendered");
                }
            }
            Err(errors) => {
                let msg = errors
                    .iter()
                    .map(|e| e.message.to_string())
                    .collect::<Vec<_>>()
                    .join("\n");
                tracing::warn!(errors = %msg, "Typst compilation failed");
                self.error_message = Some(msg);
            }
        }
    }
}

impl Render for Preview {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        let content = if !self.rendered_pages.is_empty() {
            let mut page_container = div()
                .flex()
                .flex_col()
                .gap_2()
                .p_4()
                .bg(rgb(0xcccccc));

            for page_image in &self.rendered_pages {
                page_container = page_container.child(
                    div()
                        .bg(rgb(0xffffff))
                        .shadow_md()
                        .child(
                            img(ImageSource::Render(page_image.clone()))
                                .w_full(),
                        ),
                );
            }

            // Error overlay if present
            if let Some(ref err) = self.error_message {
                page_container = page_container.child(
                    div()
                        .p_2()
                        .bg(rgb(0x442222))
                        .rounded_md()
                        .text_color(rgb(0xff8888))
                        .text_xs()
                        .child(err.clone()),
                );
            }

            div()
                .size_full()
                .overflow_y_scrollbar()
                .child(page_container)
                .into_any_element()
        } else if let Some(ref err) = self.error_message {
            div()
                .size_full()
                .p_4()
                .child(
                    div()
                        .text_color(rgb(0xff6666))
                        .child(err.clone()),
                )
                .into_any_element()
        } else {
            div()
                .size_full()
                .flex()
                .items_center()
                .justify_center()
                .text_color(rgb(0x888888))
                .child("Type Typst source on the left to see preview")
                .into_any_element()
        };

        div().size_full().child(content)
    }
}
