use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::{Path, PathBuf};
use std::sync::mpsc;


/// Events from the file watcher, filtered to what Love Note cares about.
#[derive(Debug, Clone)]
pub enum FileEvent {
    /// A .typ file was modified.
    Modified(PathBuf),
    /// A new file was created.
    Created(PathBuf),
    /// A file was removed.
    Removed(PathBuf),
}

/// Watches the workspace directory for file changes.
pub struct FileWatcher {
    _watcher: RecommendedWatcher,
    receiver: mpsc::Receiver<FileEvent>,
}

impl FileWatcher {
    /// Start watching the given directory recursively.
    pub fn new(watch_dir: &Path) -> anyhow::Result<Self> {
        let (tx, rx) = mpsc::channel();

        let sender = tx.clone();
        let mut watcher = notify::recommended_watcher(move |result: Result<Event, notify::Error>| {
            let Ok(event) = result else { return };

            for path in &event.paths {
                let file_event = match event.kind {
                    EventKind::Modify(_) => Some(FileEvent::Modified(path.clone())),
                    EventKind::Create(_) => Some(FileEvent::Created(path.clone())),
                    EventKind::Remove(_) => Some(FileEvent::Removed(path.clone())),
                    _ => None,
                };

                if let Some(fe) = file_event {
                    let _ = sender.send(fe);
                }
            }
        })?;

        watcher.watch(watch_dir, RecursiveMode::Recursive)?;
        tracing::info!(path = %watch_dir.display(), "File watcher started");

        Ok(Self {
            _watcher: watcher,
            receiver: rx,
        })
    }

    /// Drain all pending events (non-blocking).
    pub fn poll_events(&self) -> Vec<FileEvent> {
        let mut events = Vec::new();
        while let Ok(event) = self.receiver.try_recv() {
            events.push(event);
        }
        events
    }
}

/// Check for files that changed while the app was not running.
/// Compares .typ file contents in workspace against stored content.
pub struct ChangedFile {
    pub dir_name: String,
    pub file_content: String,
}

/// Scan workspace for .typ files that differ from what's stored.
pub fn check_external_changes(
    workspace_dir: &Path,
    read_stored: impl Fn(&str) -> Option<String>,
) -> Vec<ChangedFile> {
    let mut changes = Vec::new();

    let Ok(entries) = std::fs::read_dir(workspace_dir) else {
        return changes;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let main_typ = path.join("main.typ");
        if !main_typ.exists() {
            continue;
        }

        let dir_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        let Ok(file_content) = std::fs::read_to_string(&main_typ) else {
            continue;
        };

        if let Some(stored_content) = read_stored(&dir_name) {
            if file_content != stored_content {
                tracing::info!(experiment = %dir_name, "External change detected");
                changes.push(ChangedFile {
                    dir_name,
                    file_content,
                });
            }
        }
    }

    changes
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::Duration;
    use tempfile::tempdir;

    #[test]
    fn detect_external_changes() {
        let dir = tempdir().unwrap();
        let exp_dir = dir.path().join("2026-04-13_test");
        fs::create_dir_all(&exp_dir).unwrap();
        fs::write(exp_dir.join("main.typ"), "= Modified externally").unwrap();

        let changes = check_external_changes(dir.path(), |name| {
            if name == "2026-04-13_test" {
                Some("= Original content".to_string())
            } else {
                None
            }
        });

        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0].dir_name, "2026-04-13_test");
        assert_eq!(changes[0].file_content, "= Modified externally");
    }

    #[test]
    fn no_changes_when_content_matches() {
        let dir = tempdir().unwrap();
        let exp_dir = dir.path().join("2026-04-13_same");
        fs::create_dir_all(&exp_dir).unwrap();
        fs::write(exp_dir.join("main.typ"), "= Same content").unwrap();

        let changes = check_external_changes(dir.path(), |name| {
            if name == "2026-04-13_same" {
                Some("= Same content".to_string())
            } else {
                None
            }
        });

        assert!(changes.is_empty());
    }

    #[test]
    fn watcher_detects_file_modification() {
        let dir = tempdir().unwrap();
        let test_file = dir.path().join("test.typ");
        fs::write(&test_file, "initial").unwrap();

        let watcher = FileWatcher::new(dir.path()).unwrap();

        // Modify the file
        std::thread::sleep(Duration::from_millis(100));
        fs::write(&test_file, "modified").unwrap();
        std::thread::sleep(Duration::from_millis(500));

        let events = watcher.poll_events();
        assert!(!events.is_empty(), "Should have detected file change");
    }
}
