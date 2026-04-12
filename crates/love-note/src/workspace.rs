use anyhow::{Context, Result};
use chrono::{Local, NaiveDate};
use directories::ProjectDirs;
use std::fs;
use std::path::{Path, PathBuf};

/// Information about an experiment directory.
#[derive(Debug, Clone)]
pub struct ExperimentInfo {
    pub path: PathBuf,
    pub slug: String,
    pub date: Option<NaiveDate>,
    pub last_modified: Option<chrono::DateTime<chrono::Utc>>,
}

/// Information about a file in an experiment directory.
#[derive(Debug, Clone)]
pub struct ExperimentFile {
    pub path: PathBuf,
    pub filename: String,
    pub size: u64,
    pub is_image: bool,
}

impl ExperimentFile {
    /// Format file size for display.
    pub fn size_display(&self) -> String {
        if self.size < 1024 {
            format!("{} B", self.size)
        } else if self.size < 1024 * 1024 {
            format!("{:.1} KB", self.size as f64 / 1024.0)
        } else {
            format!("{:.1} MB", self.size as f64 / (1024.0 * 1024.0))
        }
    }
}

impl ExperimentFile {
    /// Get the file extension, lowercase.
    pub fn extension(&self) -> Option<String> {
        self.path.extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase())
    }
}

/// Manages the workspace directory containing experiment folders.
pub struct Workspace {
    root_dir: PathBuf,
}

impl Workspace {
    /// Open the default workspace directory.
    pub fn open() -> Result<Self> {
        let proj_dirs = ProjectDirs::from("com", "lovenote", "LoveNote")
            .context("Failed to determine project directories")?;
        let root_dir = proj_dirs.data_dir().join("workspace");
        Self::open_at(root_dir)
    }

    /// Open a workspace at a specific path.
    pub fn open_at(root_dir: PathBuf) -> Result<Self> {
        fs::create_dir_all(&root_dir)
            .with_context(|| format!("Failed to create workspace at {}", root_dir.display()))?;
        tracing::debug!(path = %root_dir.display(), "Workspace opened");
        Ok(Self { root_dir })
    }

    /// Get the root directory path.
    pub fn root_dir(&self) -> &Path {
        &self.root_dir
    }

    /// Create a new experiment directory with a main.typ file.
    /// Returns the path to the created directory.
    pub fn create_experiment(&self, name: &str) -> Result<PathBuf> {
        let date = Local::now().format("%Y-%m-%d").to_string();
        let slug = to_slug(name);
        let base_name = format!("{}_{}", date, slug);

        // Find a unique directory name by appending a suffix if needed
        let dir_name = if !self.root_dir.join(&base_name).exists() {
            base_name
        } else {
            let mut counter = 2;
            loop {
                let candidate = format!("{}-{}", base_name, counter);
                if !self.root_dir.join(&candidate).exists() {
                    break candidate;
                }
                counter += 1;
            }
        };
        let dir_path = self.root_dir.join(&dir_name);

        fs::create_dir_all(&dir_path)
            .with_context(|| format!("Failed to create experiment dir: {}", dir_path.display()))?;

        let main_typ = dir_path.join("main.typ");
        if !main_typ.exists() {
            let content = format!(
                "// {}\n// Created: {}\n\n= {}\n\n",
                name,
                Local::now().format("%Y-%m-%d %H:%M"),
                name,
            );
            fs::write(&main_typ, &content)
                .with_context(|| format!("Failed to write {}", main_typ.display()))?;
        }

        tracing::info!(path = %dir_path.display(), "Experiment created");
        Ok(dir_path)
    }

    /// List all experiments in the workspace.
    pub fn list_experiments(&self) -> Result<Vec<ExperimentInfo>> {
        let mut experiments = Vec::new();

        if !self.root_dir.exists() {
            return Ok(experiments);
        }

        for entry in fs::read_dir(&self.root_dir)? {
            let entry = entry?;
            let path = entry.path();

            if !path.is_dir() {
                continue;
            }

            // Check that main.typ exists
            if !path.join("main.typ").exists() {
                continue;
            }

            let dir_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            let date = parse_date_from_dirname(&dir_name);

            let last_modified = path
                .join("main.typ")
                .metadata()
                .ok()
                .and_then(|m| m.modified().ok())
                .map(|t| chrono::DateTime::<chrono::Utc>::from(t));

            experiments.push(ExperimentInfo {
                path,
                slug: dir_name,
                date,
                last_modified,
            });
        }

        // Sort by date descending (newest first)
        experiments.sort_by(|a, b| b.slug.cmp(&a.slug));

        Ok(experiments)
    }

    /// Read the main.typ content for an experiment.
    pub fn read_experiment(&self, dir_name: &str) -> Result<String> {
        let main_typ = self.root_dir.join(dir_name).join("main.typ");
        fs::read_to_string(&main_typ)
            .with_context(|| format!("Failed to read {}", main_typ.display()))
    }

    /// Write the main.typ content for an experiment.
    pub fn write_experiment(&self, dir_name: &str, content: &str) -> Result<()> {
        let main_typ = self.root_dir.join(dir_name).join("main.typ");
        fs::write(&main_typ, content)
            .with_context(|| format!("Failed to write {}", main_typ.display()))
    }

    /// List files in an experiment directory (excluding main.typ).
    pub fn list_experiment_files(&self, dir_name: &str) -> Result<Vec<ExperimentFile>> {
        let dir_path = self.root_dir.join(dir_name);
        let mut files = Vec::new();

        if !dir_path.exists() {
            return Ok(files);
        }

        for entry in fs::read_dir(&dir_path)? {
            let entry = entry?;
            let path = entry.path();

            if !path.is_file() {
                continue;
            }

            let filename = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            // Skip main.typ (it's the notebook itself)
            if filename == "main.typ" {
                continue;
            }

            let size = path.metadata().map(|m| m.len()).unwrap_or(0);
            let is_image = matches!(
                path.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()).as_deref(),
                Some("png" | "jpg" | "jpeg" | "gif" | "tiff" | "tif" | "bmp" | "webp" | "svg")
            );

            files.push(ExperimentFile {
                path,
                filename,
                size,
                is_image,
            });
        }

        files.sort_by(|a, b| a.filename.cmp(&b.filename));
        Ok(files)
    }

    /// Copy a file into an experiment directory.
    /// Returns the filename in the experiment directory.
    pub fn add_file_to_experiment(&self, dir_name: &str, source: &Path) -> Result<String> {
        let filename = source
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| anyhow::anyhow!("Invalid filename"))?
            .to_string();

        let dest = self.root_dir.join(dir_name).join(&filename);

        // If file already exists, add a suffix
        let dest = if dest.exists() {
            let stem = source.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
            let ext = source.extension().and_then(|e| e.to_str()).unwrap_or("");
            let mut counter = 2;
            loop {
                let candidate = if ext.is_empty() {
                    self.root_dir.join(dir_name).join(format!("{}-{}", stem, counter))
                } else {
                    self.root_dir.join(dir_name).join(format!("{}-{}.{}", stem, counter, ext))
                };
                if !candidate.exists() {
                    break candidate;
                }
                counter += 1;
            }
        } else {
            dest
        };

        fs::copy(source, &dest)
            .with_context(|| format!("Failed to copy {} to {}", source.display(), dest.display()))?;

        let final_name = dest.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();
        tracing::info!(file = %final_name, experiment = dir_name, "File added to experiment");
        Ok(final_name)
    }

    /// Delete a file from an experiment directory.
    pub fn delete_file(&self, dir_name: &str, filename: &str) -> Result<()> {
        let file_path = self.root_dir.join(dir_name).join(filename);
        if file_path.exists() {
            fs::remove_file(&file_path)
                .with_context(|| format!("Failed to delete {}", file_path.display()))?;
            tracing::info!(file = filename, experiment = dir_name, "File deleted");
        }
        Ok(())
    }

    /// Rename a file in an experiment directory.
    pub fn rename_file(&self, dir_name: &str, old_name: &str, new_name: &str) -> Result<String> {
        let old_path = self.root_dir.join(dir_name).join(old_name);
        let new_path = self.root_dir.join(dir_name).join(new_name);
        anyhow::ensure!(old_path.exists(), "File not found: {}", old_name);
        anyhow::ensure!(!new_path.exists(), "File already exists: {}", new_name);

        fs::rename(&old_path, &new_path)
            .with_context(|| format!("Failed to rename {} to {}", old_name, new_name))?;

        tracing::info!(old = old_name, new = new_name, "File renamed");
        Ok(new_name.to_string())
    }

    /// Delete an experiment directory and all its contents.
    pub fn delete_experiment(&self, dir_name: &str) -> Result<()> {
        let dir_path = self.root_dir.join(dir_name);
        if dir_path.exists() {
            fs::remove_dir_all(&dir_path)
                .with_context(|| format!("Failed to delete {}", dir_path.display()))?;
            tracing::info!(path = %dir_path.display(), "Experiment deleted");
        }
        Ok(())
    }

    /// Rename an experiment directory.
    /// Keeps the date prefix and changes only the slug part.
    /// Returns the new directory name.
    pub fn rename_experiment(&self, old_dir_name: &str, new_name: &str) -> Result<String> {
        let old_path = self.root_dir.join(old_dir_name);
        anyhow::ensure!(old_path.exists(), "Experiment not found: {}", old_dir_name);

        // Preserve the date prefix (first 10 characters + underscore)
        let date_prefix = if old_dir_name.len() >= 11 {
            &old_dir_name[..11]
        } else {
            ""
        };

        let new_slug = to_slug(new_name);
        let new_dir_name = if date_prefix.is_empty() {
            new_slug
        } else {
            format!("{}{}", date_prefix, new_slug)
        };

        if new_dir_name == old_dir_name {
            return Ok(new_dir_name);
        }

        let new_path = self.root_dir.join(&new_dir_name);
        anyhow::ensure!(!new_path.exists(), "Directory already exists: {}", new_dir_name);

        fs::rename(&old_path, &new_path)
            .with_context(|| format!("Failed to rename {} to {}", old_path.display(), new_path.display()))?;

        tracing::info!(old = old_dir_name, new = %new_dir_name, "Experiment renamed");
        Ok(new_dir_name)
    }
}

/// Convert a name to a URL-safe slug.
fn to_slug(name: &str) -> String {
    let slug: String = name
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect();

    // Collapse multiple hyphens and trim
    let mut result = String::new();
    let mut prev_hyphen = false;
    for c in slug.chars() {
        if c == '-' {
            if !prev_hyphen && !result.is_empty() {
                result.push('-');
            }
            prev_hyphen = true;
        } else {
            result.push(c);
            prev_hyphen = false;
        }
    }
    result.trim_end_matches('-').to_string()
}

/// Parse a date from a directory name like "2026-04-13_pcr-experiment".
fn parse_date_from_dirname(name: &str) -> Option<NaiveDate> {
    if name.len() >= 10 {
        NaiveDate::parse_from_str(&name[..10], "%Y-%m-%d").ok()
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slug_from_ascii() {
        assert_eq!(to_slug("PCR Experiment"), "pcr-experiment");
    }

    #[test]
    fn slug_from_special_chars() {
        assert_eq!(to_slug("Western Blot (v2)"), "western-blot-v2");
        assert_eq!(to_slug("Hello World!!!"), "hello-world");
    }

    #[test]
    fn slug_collapses_hyphens() {
        assert_eq!(to_slug("a   b   c"), "a-b-c");
    }

    #[test]
    fn parse_date_valid() {
        let d = parse_date_from_dirname("2026-04-13_pcr");
        assert_eq!(d, Some(NaiveDate::from_ymd_opt(2026, 4, 13).unwrap()));
    }

    #[test]
    fn parse_date_invalid() {
        assert_eq!(parse_date_from_dirname("not-a-date"), None);
    }
}
