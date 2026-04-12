use chrono::{Datelike, Timelike};
use std::path::PathBuf;
use typst::diag::{FileError, FileResult};
use typst::foundations::{Bytes, Datetime};
use typst::syntax::{FileId, Source, VirtualPath};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, LibraryExt, World};
use typst_kit::fonts::{FontSearcher, FontSlot, Fonts};

/// A minimal World implementation for Love Note.
///
/// Manages the main Typst source, fonts, and the standard library.
/// Resolves file references (images, CSV) relative to the experiment directory.
pub struct LoveNoteWorld {
    main_source: Source,
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<FontSlot>,
    /// The directory containing the current experiment's files.
    root_dir: Option<PathBuf>,
}

impl LoveNoteWorld {
    /// Create a new world with the given source text.
    pub fn new(source_text: &str) -> Self {
        let main_id = FileId::new(None, VirtualPath::new("main.typ"));
        let main_source = Source::new(main_id, source_text.to_string());

        let Fonts { book, fonts } = FontSearcher::new()
            .include_system_fonts(true)
            .search();

        tracing::info!(font_count = fonts.len(), "Fonts loaded");

        Self {
            main_source,
            library: LazyHash::new(Library::default()),
            book: LazyHash::new(book),
            fonts,
            root_dir: None,
        }
    }

    /// Set the root directory for file resolution.
    pub fn set_root_dir(&mut self, dir: PathBuf) {
        self.root_dir = Some(dir);
    }

    /// Update the source text (for incremental compilation).
    pub fn set_source(&mut self, text: &str) {
        self.main_source.replace(text);
    }

    /// Resolve a virtual path to a real file path.
    fn resolve_path(&self, id: FileId) -> Option<PathBuf> {
        let root = self.root_dir.as_ref()?;
        let vpath = id.vpath().as_rooted_path();
        // Strip the leading "/" from the rooted path
        let relative = vpath.strip_prefix("/").unwrap_or(vpath);
        Some(root.join(relative))
    }
}

impl World for LoveNoteWorld {
    fn library(&self) -> &LazyHash<Library> {
        &self.library
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &self.book
    }

    fn main(&self) -> FileId {
        self.main_source.id()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.main_source.id() {
            Ok(self.main_source.clone())
        } else {
            Err(FileError::NotFound(id.vpath().as_rooted_path().into()))
        }
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        if let Some(path) = self.resolve_path(id) {
            if path.exists() {
                let data = std::fs::read(&path)
                    .map_err(|_| FileError::AccessDenied)?;
                return Ok(Bytes::new(data));
            }
        }
        Err(FileError::NotFound(id.vpath().as_rooted_path().into()))
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.get(index).and_then(|slot| slot.get())
    }

    fn today(&self, offset: Option<i64>) -> Option<Datetime> {
        let now = chrono::Local::now();
        let utc = now.naive_utc();

        let dt = if let Some(offset) = offset {
            utc + chrono::Duration::hours(offset)
        } else {
            now.naive_local()
        };

        Datetime::from_ymd_hms(
            dt.date().year(),
            dt.date().month() as u8,
            dt.date().day() as u8,
            dt.time().hour() as u8,
            dt.time().minute() as u8,
            dt.time().second() as u8,
        )
    }
}
