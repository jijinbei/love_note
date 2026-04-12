use love_note::crypto::KeyStore;
use love_note::storage::{SignatureMeaning, SignatureRecord, Storage};
use tempfile::tempdir;
use uuid::Uuid;

fn open_temp_storage() -> Storage {
    let dir = tempdir().unwrap();
    let db_path = dir.keep().join("test.redb");
    Storage::open_at(db_path).unwrap()
}

#[test]
fn sign_and_verify_revision() {
    let storage = open_temp_storage();
    let key_dir = tempdir().unwrap();
    let keystore = KeyStore::open(key_dir.path().to_path_buf()).unwrap();

    let doc_id = Uuid::new_v4();

    // Create a revision
    let rev = storage
        .create_revision(
            doc_id,
            "= Experiment\n\nResults here".to_string(),
            serde_json::Value::Null,
            "tanaka".to_string(),
            "Initial record".to_string(),
        )
        .unwrap();

    // Sign the revision
    let signature = keystore.sign_hash(&rev.hash);
    let public_key = keystore.public_key_bytes();

    let record = SignatureRecord {
        revision_hash: rev.hash,
        meaning: SignatureMeaning::Authorship,
        signature: signature.clone(),
        public_key: public_key.clone(),
        signer: "tanaka".to_string(),
        signed_at: chrono::Utc::now(),
        tsa_token: None,
    };

    // Save and load
    storage.save_signature(&record).unwrap();
    let loaded = storage.load_signature(&rev.hash).unwrap().unwrap();

    assert_eq!(loaded.signer, "tanaka");
    assert_eq!(loaded.meaning, SignatureMeaning::Authorship);

    // Verify the signature
    assert!(KeyStore::verify(&rev.hash, &loaded.signature, &loaded.public_key).unwrap());
}

#[test]
fn tampered_revision_fails_signature_verification() {
    let key_dir = tempdir().unwrap();
    let keystore = KeyStore::open(key_dir.path().to_path_buf()).unwrap();

    let hash: [u8; 32] = [0xab; 32];
    let signature = keystore.sign_hash(&hash);
    let public_key = keystore.public_key_bytes();

    // Tamper with the hash
    let tampered_hash: [u8; 32] = [0xcd; 32];
    assert!(!KeyStore::verify(&tampered_hash, &signature, &public_key).unwrap());
}
