use anyhow::Result;
use love_note::Storage;
use std::path::PathBuf;

fn main() -> Result<()> {
    let storage = match std::env::args().nth(1) {
        Some(path) => Storage::open_at(PathBuf::from(path))?,
        None => Storage::open()?,
    };

    let docs = storage.list_documents()?;

    if docs.is_empty() {
        println!("No documents found.");
        return Ok(());
    }

    println!("{} document(s):\n", docs.len());
    for (id, title) in &docs {
        let doc = storage.load_document(*id)?;
        if let Some(doc) = doc {
            let preview: String = doc.content.chars().take(50).collect();
            let preview = preview.replace('\n', "\\n");
            println!("  ID:      {}", doc.id);
            println!("  Title:   {}", doc.title);
            println!("  Content: {}...", preview);
            println!("  Locked:  {}", doc.locked);
            println!("  Updated: {}", doc.updated_at);
            println!();
        } else {
            println!("  ID: {} (title: {}) — failed to load", id, title);
        }
    }

    Ok(())
}
