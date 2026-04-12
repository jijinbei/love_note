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
        let dir_name = format!("{}_{}", date, slug);
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
