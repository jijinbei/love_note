use anyhow::Result;
use love_note::Storage;
use std::path::PathBuf;

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();

    let verify = args.iter().any(|a| a == "--verify");
    let db_path = args.iter().find(|a| !a.starts_with('-') && *a != &args[0]);

    let storage = match db_path {
        Some(path) => Storage::open_at(PathBuf::from(path))?,
        None => Storage::open()?,
    };

    // Documents
    let docs = storage.list_documents()?;
    if docs.is_empty() {
        println!("No documents found.");
    } else {
        println!("=== Documents ({}) ===\n", docs.len());
        for (id, _title) in &docs {
            if let Some(doc) = storage.load_document(*id)? {
                let preview: String = doc.content.chars().take(50).collect();
                let preview = preview.replace('\n', "\\n");
                println!("  ID:      {}", doc.id);
                println!("  Title:   {}", doc.title);
                println!("  Content: {}...", preview);
                println!("  Locked:  {}", doc.locked);
                println!("  Updated: {}", doc.updated_at);

                // Revisions for this document
                let revisions = storage.list_revisions(doc.id)?;
                println!("  Revisions: {}", revisions.len());

                if !revisions.is_empty() {
                    for rev in &revisions {
                        let hash_hex: String = rev.hash.iter().map(|b| format!("{:02x}", b)).collect();
                        println!(
                            "    #{}: {} ({})",
                            rev.sequence,
                            &hash_hex[..16],
                            rev.change_summary,
                        );
                    }
                }

                if verify {
                    let status = storage.verify_chain(doc.id)?;
                    println!("  Chain: {:?}", status);
                }

                println!();
            }
        }
    }

    Ok(())
}
