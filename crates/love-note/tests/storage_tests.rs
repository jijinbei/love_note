use love_note::{Storage, TypstDocument};
use tempfile::tempdir;
use uuid::Uuid;

fn open_temp_storage() -> Storage {
    let dir = tempdir().unwrap();
    let db_path = dir.keep().join("test.redb");
    Storage::open_at(db_path).unwrap()
}

#[test]
fn save_and_load_document() {
    let storage = open_temp_storage();
    let mut doc = TypstDocument::new("PCR Experiment");
    doc.content = "= PCR\n\nHello world".to_string();

    storage.save_document(&doc).unwrap();
    let loaded = storage.load_document(doc.id).unwrap().unwrap();

    assert_eq!(loaded.id, doc.id);
    assert_eq!(loaded.title, "PCR Experiment");
    assert_eq!(loaded.content, "= PCR\n\nHello world");
}

#[test]
fn list_documents_returns_correct_count() {
    let storage = open_temp_storage();

    let doc1 = TypstDocument::new("Experiment 1");
    let doc2 = TypstDocument::new("Experiment 2");
    let doc3 = TypstDocument::new("Experiment 3");
    storage.save_document(&doc1).unwrap();
    storage.save_document(&doc2).unwrap();
    storage.save_document(&doc3).unwrap();

    let list = storage.list_documents().unwrap();
    assert_eq!(list.len(), 3);
}

#[test]
fn delete_document_removes_it() {
    let storage = open_temp_storage();
    let doc = TypstDocument::new("To Delete");
    storage.save_document(&doc).unwrap();

    let removed = storage.delete_document(doc.id).unwrap();
    assert!(removed);

    let loaded = storage.load_document(doc.id).unwrap();
    assert!(loaded.is_none());
}

#[test]
fn load_nonexistent_returns_none() {
    let storage = open_temp_storage();
    let loaded = storage.load_document(Uuid::new_v4()).unwrap();
    assert!(loaded.is_none());
}

#[test]
fn save_multiple_and_list() {
    let storage = open_temp_storage();

    for i in 0..5 {
        let doc = TypstDocument::new(&format!("Experiment {}", i));
        storage.save_document(&doc).unwrap();
    }

    let list = storage.list_documents().unwrap();
    assert_eq!(list.len(), 5);

    let titles: Vec<&str> = list.iter().map(|(_, t)| t.as_str()).collect();
    for i in 0..5 {
        assert!(titles.contains(&format!("Experiment {}", i).as_str()));
    }
}

#[test]
fn get_or_create_default_creates_when_empty() {
    let storage = open_temp_storage();
    let doc = storage.get_or_create_default().unwrap();

    assert_eq!(doc.title, "Untitled Experiment");
    assert!(doc.content.is_empty());

    // Calling again returns the same document
    let doc2 = storage.get_or_create_default().unwrap();
    assert_eq!(doc.id, doc2.id);
}

#[test]
fn update_document_content() {
    let storage = open_temp_storage();
    let mut doc = TypstDocument::new("Mutable Doc");
    doc.content = "version 1".to_string();
    storage.save_document(&doc).unwrap();

    doc.content = "version 2".to_string();
    storage.save_document(&doc).unwrap();

    let loaded = storage.load_document(doc.id).unwrap().unwrap();
    assert_eq!(loaded.content, "version 2");
}
