use love_note::storage::{ChainStatus, Storage};
use tempfile::tempdir;
use uuid::Uuid;

fn open_temp_storage() -> Storage {
    let dir = tempdir().unwrap();
    let db_path = dir.keep().join("test.redb");
    Storage::open_at(db_path).unwrap()
}

#[test]
fn create_and_load_revision() {
    let storage = open_temp_storage();
    let doc_id = Uuid::new_v4();

    let rev = storage
        .create_revision(
            doc_id,
            "= Hello".to_string(),
            serde_json::Value::Null,
            "test_user".to_string(),
            "initial".to_string(),
        )
        .unwrap();

    assert_eq!(rev.sequence, 0);
    assert!(rev.prev_hash.is_none());

    let loaded = storage.load_revision(&rev.hash).unwrap().unwrap();
    assert_eq!(loaded.content, "= Hello");
    assert_eq!(loaded.author, "test_user");
}

#[test]
fn chain_of_revisions() {
    let storage = open_temp_storage();
    let doc_id = Uuid::new_v4();

    for i in 0..5 {
        storage
            .create_revision(
                doc_id,
                format!("version {}", i),
                serde_json::Value::Null,
                "author".to_string(),
                format!("change {}", i),
            )
            .unwrap();
    }

    let revisions = storage.list_revisions(doc_id).unwrap();
    assert_eq!(revisions.len(), 5);
    assert_eq!(revisions[0].sequence, 0);
    assert_eq!(revisions[4].sequence, 4);

    // Chain should be valid
    let status = storage.verify_chain(doc_id).unwrap();
    assert_eq!(status, ChainStatus::Valid);
}

#[test]
fn get_latest_revision() {
    let storage = open_temp_storage();
    let doc_id = Uuid::new_v4();

    assert!(storage.get_latest_revision(doc_id).unwrap().is_none());

    storage
        .create_revision(doc_id, "v1".into(), serde_json::Value::Null, "a".into(), "c".into())
        .unwrap();
    storage
        .create_revision(doc_id, "v2".into(), serde_json::Value::Null, "a".into(), "c".into())
        .unwrap();

    let latest = storage.get_latest_revision(doc_id).unwrap().unwrap();
    assert_eq!(latest.sequence, 1);
    assert_eq!(latest.content, "v2");
}

#[test]
fn empty_chain_verification() {
    let storage = open_temp_storage();
    let doc_id = Uuid::new_v4();

    let status = storage.verify_chain(doc_id).unwrap();
    assert_eq!(status, ChainStatus::Empty);
}

#[test]
fn revisions_for_different_documents_are_separate() {
    let storage = open_temp_storage();
    let doc_a = Uuid::new_v4();
    let doc_b = Uuid::new_v4();

    storage
        .create_revision(doc_a, "doc A".into(), serde_json::Value::Null, "a".into(), "c".into())
        .unwrap();
    storage
        .create_revision(doc_b, "doc B v1".into(), serde_json::Value::Null, "a".into(), "c".into())
        .unwrap();
    storage
        .create_revision(doc_b, "doc B v2".into(), serde_json::Value::Null, "a".into(), "c".into())
        .unwrap();

    assert_eq!(storage.list_revisions(doc_a).unwrap().len(), 1);
    assert_eq!(storage.list_revisions(doc_b).unwrap().len(), 2);
}
