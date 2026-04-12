use chrono::{Datelike, Timelike};
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
/// File resolution (for #import and #image) will be extended in later phases.
pub struct LoveNoteWorld {
    main_source: Source,
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<FontSlot>,
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
        }
    }

    /// Update the source text (for incremental compilation).
    pub fn set_source(&mut self, text: &str) {
        self.main_source.replace(text);
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
