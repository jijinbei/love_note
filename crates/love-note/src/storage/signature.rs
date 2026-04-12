use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// The meaning/purpose of a signature.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SignatureMeaning {
    /// The signer authored this record.
    Authorship,
    /// The signer approves/confirms this record (e.g., PI).
    Approval,
    /// The signer reviewed this record (third party).
    Review,
}

impl std::fmt::Display for SignatureMeaning {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SignatureMeaning::Authorship => write!(f, "Authorship"),
            SignatureMeaning::Approval => write!(f, "Approval"),
            SignatureMeaning::Review => write!(f, "Review"),
        }
    }
}

/// A digital signature record for a revision.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureRecord {
    /// The hash of the revision that was signed.
    pub revision_hash: [u8; 32],
    /// The meaning of this signature.
    pub meaning: SignatureMeaning,
    /// The Ed25519 signature bytes (64 bytes).
    pub signature: Vec<u8>,
    /// The signer's public key (32 bytes).
    pub public_key: Vec<u8>,
    /// Human-readable signer name.
    pub signer: String,
    /// When the signature was created.
    pub signed_at: DateTime<Utc>,
    /// RFC 3161 TSA token (future use).
    pub tsa_token: Option<Vec<u8>>,
}
