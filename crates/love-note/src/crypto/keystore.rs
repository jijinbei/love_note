use anyhow::{Context, Result};
use ed25519_dalek::{Signer, SigningKey, Verifier, VerifyingKey};
use rand::rngs::OsRng;
use std::fs;
use std::path::{Path, PathBuf};

/// Manages Ed25519 key pairs for signing revisions.
pub struct KeyStore {
    signing_key: SigningKey,
    key_dir: PathBuf,
}

impl KeyStore {
    /// Load or generate a key pair at the given directory.
    /// Keys are stored as raw bytes:
    ///   - `signing.key` (32 bytes, encrypted with passphrase in future)
    ///   - `verifying.pub` (32 bytes)
    pub fn open(key_dir: PathBuf) -> Result<Self> {
        fs::create_dir_all(&key_dir)
            .with_context(|| format!("Failed to create key directory: {}", key_dir.display()))?;

        let signing_path = key_dir.join("signing.key");
        let verifying_path = key_dir.join("verifying.pub");

        let signing_key = if signing_path.exists() {
            let bytes = fs::read(&signing_path)
                .context("Failed to read signing key")?;
            let key_bytes: [u8; 32] = bytes
                .try_into()
                .map_err(|_| anyhow::anyhow!("Invalid signing key length"))?;
            SigningKey::from_bytes(&key_bytes)
        } else {
            let key = SigningKey::generate(&mut OsRng);

            // Save keys
            fs::write(&signing_path, key.to_bytes())
                .context("Failed to write signing key")?;
            fs::write(&verifying_path, key.verifying_key().to_bytes())
                .context("Failed to write verifying key")?;

            tracing::info!("Generated new Ed25519 key pair");
            key
        };

        Ok(Self {
            signing_key,
            key_dir,
        })
    }

    /// Sign arbitrary data.
    pub fn sign(&self, data: &[u8]) -> Vec<u8> {
        let signature = self.signing_key.sign(data);
        signature.to_bytes().to_vec()
    }

    /// Get the public key bytes.
    pub fn public_key_bytes(&self) -> Vec<u8> {
        self.signing_key.verifying_key().to_bytes().to_vec()
    }

    /// Verify a signature against data and a public key.
    pub fn verify(data: &[u8], signature: &[u8], public_key: &[u8]) -> Result<bool> {
        let sig_bytes: [u8; 64] = signature
            .try_into()
            .map_err(|_| anyhow::anyhow!("Invalid signature length"))?;
        let key_bytes: [u8; 32] = public_key
            .try_into()
            .map_err(|_| anyhow::anyhow!("Invalid public key length"))?;

        let verifying_key = VerifyingKey::from_bytes(&key_bytes)
            .context("Invalid public key")?;
        let signature = ed25519_dalek::Signature::from_bytes(&sig_bytes);

        Ok(verifying_key.verify(data, &signature).is_ok())
    }

    /// Sign a revision hash.
    pub fn sign_hash(&self, hash: &[u8; 32]) -> Vec<u8> {
        self.sign(hash)
    }

    /// Get the key directory path.
    pub fn key_dir(&self) -> &Path {
        &self.key_dir
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sha2::{Digest, Sha256};
    use tempfile::tempdir;

    #[test]
    fn generate_and_load_keys() {
        let dir = tempdir().unwrap();
        let key_dir = dir.path().to_path_buf();

        // First open: generates keys
        let ks1 = KeyStore::open(key_dir.clone()).unwrap();
        let pub1 = ks1.public_key_bytes();

        // Second open: loads existing keys
        let ks2 = KeyStore::open(key_dir).unwrap();
        let pub2 = ks2.public_key_bytes();

        assert_eq!(pub1, pub2);
    }

    #[test]
    fn sign_and_verify() {
        let dir = tempdir().unwrap();
        let ks = KeyStore::open(dir.path().to_path_buf()).unwrap();

        let data = b"hello world";
        let signature = ks.sign(data);
        let public_key = ks.public_key_bytes();

        assert!(KeyStore::verify(data, &signature, &public_key).unwrap());
    }

    #[test]
    fn verify_fails_with_wrong_data() {
        let dir = tempdir().unwrap();
        let ks = KeyStore::open(dir.path().to_path_buf()).unwrap();

        let signature = ks.sign(b"original");
        let public_key = ks.public_key_bytes();

        assert!(!KeyStore::verify(b"tampered", &signature, &public_key).unwrap());
    }

    #[test]
    fn verify_fails_with_wrong_key() {
        let dir1 = tempdir().unwrap();
        let dir2 = tempdir().unwrap();
        let ks1 = KeyStore::open(dir1.path().to_path_buf()).unwrap();
        let ks2 = KeyStore::open(dir2.path().to_path_buf()).unwrap();

        let data = b"hello";
        let signature = ks1.sign(data);
        let wrong_key = ks2.public_key_bytes();

        assert!(!KeyStore::verify(data, &signature, &wrong_key).unwrap());
    }

    #[test]
    fn sign_revision_hash() {
        let dir = tempdir().unwrap();
        let ks = KeyStore::open(dir.path().to_path_buf()).unwrap();

        let hash: [u8; 32] = Sha256::digest(b"test content").into();
        let signature = ks.sign_hash(&hash);
        let public_key = ks.public_key_bytes();

        assert!(KeyStore::verify(&hash, &signature, &public_key).unwrap());
    }
}
