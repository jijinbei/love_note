use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

/// A single revision in the hash chain.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Revision {
    /// SHA-256 hash of this revision (computed from contents + metadata).
    pub hash: [u8; 32],
    /// Hash of the previous revision (None for the first revision).
    pub prev_hash: Option<[u8; 32]>,
    /// Sequence number within the document.
    pub sequence: u64,
    /// Document this revision belongs to.
    pub doc_id: Uuid,
    /// Full Typst source at this point in time.
    pub content: String,
    /// Frontmatter metadata.
    pub frontmatter: serde_json::Value,
    /// Author of this revision.
    pub author: String,
    /// When this revision was created.
    pub timestamp: DateTime<Utc>,
    /// RFC 3161 TSA token (future use).
    pub tsa_token: Option<Vec<u8>>,
    /// Brief description of what changed.
    pub change_summary: String,
}

/// Result of verifying a hash chain.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ChainStatus {
    /// All hashes match and chain is intact.
    Valid,
    /// The chain is empty (no revisions).
    Empty,
    /// A revision's content was tampered with (hash mismatch).
    Tampered { seq: u64 },
    /// The prev_hash link is broken.
    BrokenChain { seq: u64 },
}

/// Compute the SHA-256 hash for a revision.
/// The hash covers: prev_hash, doc_id, sequence, content, author, timestamp.
pub fn compute_hash(rev: &Revision) -> [u8; 32] {
    let mut hasher = Sha256::new();
    if let Some(prev) = &rev.prev_hash {
        hasher.update(prev);
    }
    hasher.update(rev.doc_id.as_bytes());
    hasher.update(&rev.sequence.to_le_bytes());
    hasher.update(rev.content.as_bytes());
    hasher.update(rev.author.as_bytes());
    hasher.update(rev.timestamp.to_rfc3339().as_bytes());
    hasher.finalize().into()
}

/// Verify the integrity of a revision chain.
pub fn verify_chain(revisions: &[Revision]) -> ChainStatus {
    if revisions.is_empty() {
        return ChainStatus::Empty;
    }

    for (i, rev) in revisions.iter().enumerate() {
        // Verify the hash matches the content
        let expected_hash = compute_hash(rev);
        if rev.hash != expected_hash {
            return ChainStatus::Tampered { seq: rev.sequence };
        }

        // Verify the chain link
        if i == 0 {
            if rev.prev_hash.is_some() {
                return ChainStatus::BrokenChain { seq: rev.sequence };
            }
        } else {
            let prev = &revisions[i - 1];
            match rev.prev_hash {
                Some(prev_hash) if prev_hash == prev.hash => {}
                _ => return ChainStatus::BrokenChain { seq: rev.sequence },
            }
        }
    }

    ChainStatus::Valid
}

/// Create a new revision linked to the chain.
pub fn create_revision(
    doc_id: Uuid,
    content: String,
    frontmatter: serde_json::Value,
    author: String,
    change_summary: String,
    prev: Option<&Revision>,
) -> Revision {
    let sequence = prev.map(|r| r.sequence + 1).unwrap_or(0);
    let prev_hash = prev.map(|r| r.hash);
    let timestamp = Utc::now();

    let mut rev = Revision {
        hash: [0u8; 32],
        prev_hash,
        sequence,
        doc_id,
        content,
        frontmatter,
        author,
        timestamp,
        tsa_token: None,
        change_summary,
    };

    rev.hash = compute_hash(&rev);
    rev
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_rev(_seq: u64, content: &str, prev: Option<&Revision>) -> Revision {
        create_revision(
            Uuid::nil(),
            content.to_string(),
            serde_json::Value::Null,
            "test".to_string(),
            "test change".to_string(),
            prev,
        )
    }

    #[test]
    fn deterministic_hash() {
        let r1 = make_rev(0, "hello", None);
        let r2 = make_rev(0, "hello", None);
        // Same content but different timestamps → different hashes
        // (this is expected behavior)
        // To test determinism, compute hash twice on the same revision
        assert_eq!(compute_hash(&r1), r1.hash);
        assert_eq!(compute_hash(&r2), r2.hash);
    }

    #[test]
    fn different_content_different_hash() {
        let r1 = make_rev(0, "hello", None);
        let mut r2 = r1.clone();
        r2.content = "world".to_string();
        r2.hash = compute_hash(&r2);
        assert_ne!(r1.hash, r2.hash);
    }

    #[test]
    fn single_byte_change_detected() {
        let r1 = make_rev(0, "abcdef", None);
        let mut r2 = r1.clone();
        r2.content = "abcdeg".to_string();
        r2.hash = compute_hash(&r2);
        assert_ne!(r1.hash, r2.hash);
    }

    #[test]
    fn valid_chain() {
        let r0 = make_rev(0, "version 1", None);
        let r1 = make_rev(1, "version 2", Some(&r0));
        let r2 = make_rev(2, "version 3", Some(&r1));
        assert_eq!(verify_chain(&[r0, r1, r2]), ChainStatus::Valid);
    }

    #[test]
    fn empty_chain() {
        assert_eq!(verify_chain(&[]), ChainStatus::Empty);
    }

    #[test]
    fn tampered_content_detected() {
        let r0 = make_rev(0, "version 1", None);
        let r1 = make_rev(1, "version 2", Some(&r0));
        let mut r2 = make_rev(2, "version 3", Some(&r1));

        // Tamper with r2's content without updating hash
        r2.content = "TAMPERED".to_string();

        assert_eq!(
            verify_chain(&[r0, r1, r2]),
            ChainStatus::Tampered { seq: 2 }
        );
    }

    #[test]
    fn broken_chain_detected() {
        let r0 = make_rev(0, "version 1", None);
        let r1 = make_rev(1, "version 2", Some(&r0));
        let mut r2 = make_rev(2, "version 3", Some(&r1));

        // Break the chain link
        r2.prev_hash = Some([0xffu8; 32]);
        r2.hash = compute_hash(&r2);

        assert_eq!(
            verify_chain(&[r0, r1, r2]),
            ChainStatus::BrokenChain { seq: 2 }
        );
    }

    #[test]
    fn ten_revision_chain() {
        let mut chain = Vec::new();
        for i in 0..10 {
            let prev = chain.last();
            let rev = make_rev(i, &format!("version {}", i), prev);
            chain.push(rev);
        }
        assert_eq!(verify_chain(&chain), ChainStatus::Valid);

        // Tamper with revision 5
        chain[5].content = "tampered".to_string();
        assert_eq!(verify_chain(&chain), ChainStatus::Tampered { seq: 5 });
    }
}
