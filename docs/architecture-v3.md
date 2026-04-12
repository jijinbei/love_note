# Love Note Architecture v3.0

Typst ベース電子実験ノート（ELN）。アカデミア向け。

## ターゲットユーザー

### Phase 1 のターゲット（明確なニッチ）

**LaTeX/Typst 文化圏の研究者**:
- 物理学、数学、計算科学、情報科学
- 数式・コード・グラフを日常的に書く人
- LaTeX の改善版として Typst を自然に受け入れられる層

ポジション: **「Typst で実験ノートを書ける唯一のツール」**

### Phase 1 で狙わない層

- 生物・化学（有機合成、分子生物）→ Word + ChemDraw/Benchling 文化
- フィールド系 → 紙ノート文化がまだ強い

理由: Typst 直接編集は `#table(columns: 3, ...)` のような構文を書くことになり、
コードを書かない研究者には受け入れられない。最初から全分野を狙うと誰にも刺さらない。

### 将来的な拡張（Phase 2 以降、需要が確認されたら）

GUI モードを追加して Typst を知らなくても使えるようにし、ターゲットを拡大する。

## 設計原則

1. **Typst First** — Typst ソース直接編集が主。フォーム入力は補助
2. **ローカルファースト** — オフラインで完全動作。サーバーは同期・バックアップ
3. **改ざん不可能** — ハッシュチェーンで全履歴を保護。過去は読めるが書き換えられない
4. **研究者に git を触らせない** — ストレージの仕組みは完全に隠蔽

## 収益モデル

- **無料**: ローカル保存。ユーザーが自分でデータを管理
- **有料**: マネージドストレージ（バックアップ、TSA タイムスタンプ、同期、チーム共有、PI 署名）

## 技術スタック

| レイヤー | 技術 | 用途 |
|---------|------|------|
| UI | GPUI | GPU 加速レンダリング |
| エディタ | Typst ソース直接編集 | シンタックスハイライト + プレビュー |
| レンダリング | typst crate | リアルタイムプレビュー + PDF 出力 |
| ローカル DB | redb | ドキュメント、リビジョン、署名、インデックス |
| 署名 | ed25519-dalek | 電子署名（Ed25519） |
| タイムスタンプ | RFC 3161 TSA | 信頼できる時刻証明 |
| プラグイン | Rhai | スクリプトベースの拡張ブロック |
| 全文検索 | tantivy | Rust 全文検索エンジン |
| サーバー同期 | 独自プロトコル | リビジョン + blob の同期 |
| blob ストレージ | S3 互換 | 大容量ファイル保管（サーバー側） |

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    Love Note クライアント                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               GPUI アプリケーション                      │  │
│  │  ┌──────────────────┐  ┌────────────────────────────┐ │  │
│  │  │  Typst エディタ    │  │    Typst プレビュー         │ │  │
│  │  │  (ソース直接編集)   │  │    (typst crate)          │ │  │
│  │  │                  │  │    リアルタイムレンダリング    │ │  │
│  │  └────────┬─────────┘  └────────────────────────────┘ │  │
│  │           │                                           │  │
│  │  ┌────────▼─────────────────────────────────────────┐ │  │
│  │  │  フォーム補助入力（スラッシュコマンド経由）           │ │  │
│  │  │  "/" → 試薬テーブル / プロトコル / CSV 等を選択      │ │  │
│  │  │  → GUI フォーム → Typst コードをエディタに挿入       │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│           │                                                 │
│  ┌────────▼──────────────────────────────────────────────┐  │
│  │                    保存レイヤー                         │  │
│  │                                                       │  │
│  │  レイヤー1: 一時保存（3秒デバウンス → redb 上書き）       │  │
│  │  レイヤー2: リビジョン作成（Ctrl+S / 5分非アクティブ      │  │
│  │            / ファイル添付 / 署名 / アプリ終了）           │  │
│  │  レイヤー3: サーバー同期（バックグラウンド、有料機能）      │  │
│  └────────┬──────────────────────────────────────────────┘  │
│           │                                                 │
│  ┌────────▼──────────────────────────────────────────────┐  │
│  │                   ストレージレイヤー                     │  │
│  │                                                       │  │
│  │  documents.redb                                       │  │
│  │  ├── documents:      最新の Typst ソース（高速アクセス） │  │
│  │  ├── revisions:      全リビジョン（ハッシュチェーン）     │  │
│  │  ├── revision_index: (doc_id, seq) → hash             │  │
│  │  ├── signatures:     電子署名データ                     │  │
│  │  ├── blob_index:     添付ファイルのメタデータ            │  │
│  │  └── search_index:   全文検索インデックス                │  │
│  │                                                       │  │
│  │  workspace/（実験単位のディレクトリ）                    │  │
│  │  ├── {日付}_{スラッグ}/main.typ  : 実験ノート本体        │  │
│  │  ├── {日付}_{スラッグ}/画像,CSV等 : 実験データ           │  │
│  │  │   ≤ 10MB: そのまま保持                              │  │
│  │  │   > 10MB: blob 管理（ローカルはキャッシュのみ）       │  │
│  │  └── templates/  : 共有テンプレート                     │  │
│  └───────────────────────────────────────────────────────┘  │
│           │                                                 │
│           │ 同期（有料サービス）                               │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────┐
│                マネージドストレージ（サーバー）                │
│                                                           │
│  ├── リビジョン受信・検証・保存                              │
│  ├── TSA タイムスタンプ付与                                  │
│  ├── オブジェクトストレージ（S3）: 全 blob 保管              │
│  ├── PI 向け Web ビュー（閲覧・署名）                        │
│  └── チーム共有・閲覧権限管理                                │
└───────────────────────────────────────────────────────────┘
```

## データモデル

### redb テーブル

```rust
// 最新のドキュメント状態（高速アクセス用）
const DOCUMENTS: TableDefinition<&[u8; 16], &[u8]>;
// key: doc_id (Uuid)
// value: Document JSON

struct Document {
    id: Uuid,
    title: String,
    content: String,              // 最新の Typst ソース
    frontmatter: serde_json::Value,
    locked: bool,                 // 署名後はロック
    locked_by: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

// リビジョン履歴（ハッシュチェーン）
const REVISIONS: TableDefinition<&[u8; 32], &[u8]>;
// key: SHA-256 hash
// value: Revision JSON

struct Revision {
    hash: [u8; 32],               // SHA-256（計算値）
    prev_hash: Option<[u8; 32]>,  // 前リビジョンのハッシュ（チェーン）
    sequence: u64,                // 連番
    doc_id: Uuid,
    content: String,              // Typst ソース全文
    frontmatter: serde_json::Value,
    author: String,
    timestamp: DateTime<Utc>,
    tsa_token: Option<Vec<u8>>,   // RFC 3161 トークン
    change_summary: String,       // 変更概要（自動生成）
}

// リビジョン検索用インデックス
const REVISION_INDEX: TableDefinition<(&[u8; 16], u64), &[u8; 32]>;
// key: (doc_id, sequence)
// value: revision hash

// 電子署名
const SIGNATURES: TableDefinition<&[u8; 32], &[u8]>;
// key: revision_hash
// value: SignatureRecord JSON

struct SignatureRecord {
    revision_hash: [u8; 32],
    meaning: SignatureMeaning,    // Authorship / Approval / Review
    signature: Vec<u8>,           // Ed25519 署名
    public_key: Vec<u8>,
    signer: String,
    signed_at: DateTime<Utc>,
    tsa_token: Option<Vec<u8>>,
}

enum SignatureMeaning {
    Authorship,   // 実験者: 「自分の記録である」
    Approval,     // PI: 「確認・承認した」
    Review,       // 第三者レビュー
}

// 添付ファイルメタデータ
const BLOB_INDEX: TableDefinition<&[u8; 32], &[u8]>;
// key: SHA-256 of file content
// value: BlobRef JSON

struct BlobRef {
    hash: [u8; 32],
    filename: String,
    size: u64,
    mime_type: String,
    state: BlobState,             // Remote / Downloading / Cached
    thumbnail_hash: Option<[u8; 32]>,
    uploaded_at: DateTime<Utc>,
}

enum BlobState {
    Remote,                       // サーバーにのみ存在
    Downloading { progress: f64 },
    Cached { local_path: PathBuf },
}
```

### ファイルシステム構造

```
~/.local/share/lovenote/
├── documents.redb                          # メイン DB
├── workspace/                              # 実験データ（実験単位のディレクトリ）
│   ├── 2026-04-11_pcr-amplification/
│   │   ├── main.typ                        # 実験ノート本体
│   │   ├── gel-image.tiff                  # ゲル画像
│   │   ├── primer-design.png               # プライマー設計図
│   │   └── results.csv                     # 定量データ
│   ├── 2026-04-11_western-blot/
│   │   ├── main.typ
│   │   ├── membrane.tiff
│   │   └── band-intensity.csv
│   ├── 2026-04-11_cell-passage/
│   │   ├── main.typ
│   │   └── confluence.jpg
│   └── templates/                          # テンプレート
│       ├── pcr.typ
│       ├── western-blot.typ
│       └── components/
│           ├── reagent-table.typ
│           └── protocol-step.typ
├── thumbnails/                             # サムネイル（常にローカル、数KB/枚）
│   └── ab/ab3f...cd.jpg
└── exports/                                # PDF/eln エクスポート
```

### 実験ディレクトリの設計

ファイル管理は **日付単位ではなく実験単位**。

理由:
- 1日に複数の実験 → 別ディレクトリに分離
- 複数日にまたがる実験 → 1ディレクトリに集約
- 画像パスが明確（`image("gel.tiff")` で同ディレクトリ内を参照）
- PI レビュー時に実験単位で共有可能
- ディレクトリごとコピーすればポータブル

ディレクトリ名の規則: `{日付}_{スラッグ}/`

```
2026-04-11_pcr-amplification/
2026-04-11_western-blot/
2026-04-15_pcr-amplification-retry/
```

### Typst からのファイル参照

```typst
// 同じ実験ディレクトリ内の画像 → 相対パス
#figure(
  image("gel-image.tiff"),
  caption: [PCR産物のゲル電気泳動結果],
)

// CSV データ読み込み
#let data = csv("results.csv")

// テンプレートは workspace ルートから
#import "../templates/pcr.typ": *
#import "../templates/components/reagent-table.typ": reagent-table
```

### blob 管理ルール

実験ディレクトリ内のファイルはサイズで管理方式を分ける:

| サイズ | 管理方式 | ローカル | サーバー |
|--------|---------|---------|---------|
| ≤ 10MB | そのまま保持 | 常にあり | 同期時にコピー |
| > 10MB | blob 管理 | キャッシュのみ | 全量保管 |

画像ドラッグ&ドロップ時のフロー:

```
1. ファイルを実験ディレクトリにコピー
2. SHA-256 ハッシュ計算
3. サイズ判定:
   ≤ 10MB → そのまま保持
   > 10MB → blob_index に登録、サーバーにアップロード
4. Typst ソースのカーソル位置に挿入:
   #figure(image("gel-image.tiff"), caption: [])
5. リビジョン作成
```

### ローカル vs サーバーのデータ分担

| データ | サイズ目安 | ローカル | サーバー |
|--------|----------|---------|---------|
| Typst ソース + 履歴 | 数 MB | 常に保持 | 同期 |
| メタデータ・インデックス | 数 MB | 常に保持 | 同期 |
| サムネイル | 数 KB/枚 | 常に保持 | 同期 |
| 署名データ | 数 KB | 常に保持 | 同期 |
| 元画像・計測データ | 数 GB | キャッシュのみ | 全量保管 |

## ハッシュチェーン

### 改ざん防止の仕組み

```
Revision 0              Revision 1              Revision 2
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ prev: None     │     │ prev: hash0    │     │ prev: hash1    │
│ content: ...   │     │ content: ...   │     │ content: ...   │
│ author: tanaka │     │ author: tanaka │     │ author: tanaka │
│ timestamp: ... │     │ timestamp: ... │     │ timestamp: ... │
│                │     │                │     │                │
│ hash0 = SHA256(│────→│ hash1 = SHA256(│────→│ hash2 = SHA256(│
│  content +     │     │  hash0 +       │     │  hash1 +       │
│  metadata)     │     │  content +     │     │  content +     │
│                │     │  metadata)     │     │  metadata)     │
└────────────────┘     └────────────────┘     └────────────────┘

改ざん時: Revision 1 の content を書き換える
  → hash1 が変わる → Revision 2 の prev_hash と不一致 → 検知
```

### ハッシュ計算

```rust
fn compute_hash(rev: &Revision) -> [u8; 32] {
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
```

### 検証

```rust
fn verify_chain(db: &Database, doc_id: Uuid) -> ChainStatus {
    // 全リビジョンを順番に走査
    // 各リビジョンの hash を再計算して照合
    // prev_hash の連続性を検証
    // → Valid / Tampered { seq } / BrokenChain { seq }
}
```

### 破損・改ざん時の復旧

#### データの正本と優先順位

```
復旧時の優先順位（上から順に試みる）:

  1. サーバー上のリビジョン（有料のみ。TSA 付きで最も信頼性が高い）
  2. redb の revisions テーブル（ハッシュチェーンで保護）
  3. redb の documents テーブル（最新の一時保存）
  4. workspace/ の .typ ファイル（プレーンテキスト、最後の砦）
```

#### ケース別の復旧戦略

| 障害 | 検知方法 | 復旧先 | データ損失 |
|------|---------|--------|-----------|
| 一時保存データ（documents）破損 | 起動時チェック / redb CRC | 最新リビジョン | 最大5分 |
| リビジョン改ざん | ハッシュチェーン検証 | 改ざん前のリビジョン | 改ざん以降が「疑い」 |
| redb ファイル全体破損 | redb が開けない | サーバー or .typ ファイル | 無料: 履歴のみ損失 |
| .typ ファイル破損・削除 | ファイルアクセス時 | redb から再生成 | なし |
| 全データ喪失 | 起動時チェック | サーバーから復旧 | 無料: 復旧不能 |

#### 改ざん検知時の UI フロー

```
起動時 or 手動検証:

  ハッシュチェーン検証
  ├─ 全て一致 → ✓ 正常（ステータスバーに緑アイコン）
  │
  └─ 不一致検出 → ⚠ 警告ダイアログ
      │
      │  「リビジョン #15 で改ざんが検出されました」
      │  「信頼できる最終地点: リビジョン #14（2026-04-12 15:30）」
      │  「影響を受けるリビジョン: #15 〜 #18（4件）」
      │
      │  [差分を確認]  [#14に復元]  [そのまま続行]
      │
      ├─ 「差分を確認」→ #14 と #15 の diff を表示
      │
      ├─ 「#14に復元」→ #14 の内容で新しいリビジョン #19 を作成
      │   → #15〜#18 は tampered フラグ付きで履歴に残す（削除しない）
      │
      └─ 「そのまま続行」→ 警告を記録して作業継続
          → ステータスバーに黄色アイコンを常時表示
```

#### 設計原則: 何も消さない

改ざんが検出されたリビジョンでも削除しない:

- 改ざんの証拠そのものが記録として重要
- 監査時に「改ざんを検知し、対処した」と示せる
- 改ざんリビジョンに `tampered` フラグを付与し、信頼できる地点から新リビジョンを分岐
- 改ざん検知イベント自体もログに記録（日時、検知方法、対処内容）

#### 無料ユーザーの保護

サーバーがない無料ユーザーにも最低限の保護を提供:

```
1. workspace/ の .typ ファイルは常に最新を反映
   → redb が全壊しても最新のソースは残る（リビジョン履歴は失われる）

2. 定期的なローカルバックアップ（日次）
   → ~/.local/share/lovenote/backups/
   → documents.redb のコピーを7世代保持
   → ディスク容量: redb が 100MB なら 700MB（許容範囲）

3. 起動時のヘルスチェック
   → redb 破損を早期検出 → バックアップから復旧提案
```

## 外部エディタとの整合性

### 「改ざん」と「外部編集」は別概念

```
改ざん: redb 内のリビジョン（ハッシュチェーン）が書き換えられること
        → ハッシュ不一致で検知 → 警告（赤）

外部編集: workspace/ の .typ ファイルがアプリ外で変更されること
          → ハッシュチェーンには影響しない
          → 「まだリビジョンになっていない変更」として扱う → 確認（青）
```

データの正本は redb の revisions テーブル。workspace/ の .typ は「作業コピー」にすぎない。
Git の `.git/`（正本）と working directory（作業コピー）の関係と同じ。

### 検知方法

| 状態 | 検知方法 |
|------|---------|
| Love Note 起動中に外部編集 | `notify` crate（inotify/FSEvents/ReadDirectoryChangesW）でリアルタイム検知 |
| Love Note を閉じている間に外部編集 | 次回起動時に .typ の内容と redb の documents テーブルを比較 |

常駐プロセスやバックグラウンドサービスは不要。

### 起動中のファイル監視

```rust
use notify::{Watcher, RecursiveMode, Event, EventKind};

let mut watcher = notify::recommended_watcher(|event: Event| {
    match event.kind {
        EventKind::Modify(_) => {
            for path in &event.paths {
                if path.extension() == Some("typ") {
                    // redb の内容と比較 → 差分があればリビジョン作成
                }
            }
        }
        EventKind::Create(_) => {
            // 新しいファイル追加 → blob 登録
        }
        EventKind::Remove(_) => {
            // 削除 → 警告表示
        }
        _ => {}
    }
})?;

watcher.watch(workspace_dir, RecursiveMode::Recursive)?;
```

### 起動時の差分チェックフロー

```
Love Note 起動
  │
  ├─ 1. redb のハッシュチェーン検証（改ざんチェック）
  │
  ├─ 2. workspace/ と redb の差分チェック
  │   → 各 .typ の内容を redb の documents テーブルと比較
  │
  └─ 差分が見つかった場合:
      │
      │  「以下のファイルがアプリ外で変更されています:」
      │  「📄 2026-04-13_pcr/main.typ」
      │  「  最終リビジョン: 2026-04-13 15:30」
      │  「  ファイル更新日: 2026-04-13 17:45」
      │
      │  [変更を取り込む]  [差分を確認]  [元に戻す]
      │
      ├─ 「変更を取り込む」
      │   → .typ の内容で新しいリビジョンを作成
      │   → change_summary: "外部エディタによる変更"
      │   → ハッシュチェーンに正式に追加
      │
      ├─ 「差分を確認」
      │   → redb の最新内容と .typ の diff を表示
      │   → 確認後に取り込む or 元に戻すを選択
      │
      └─ 「元に戻す」
          → redb の最新リビジョンで .typ を上書き
          → 外部の変更は破棄
```

### 起動中に外部編集された場合

```
同じファイルを Love Note で編集中:
  → 競合ダイアログ
  → [外部の変更を取り込む]  [自分の変更を維持]  [差分を確認]

別のファイルを編集中 or 編集していない:
  → 静かにリビジョンを作成（change_summary: "外部エディタによる変更"）
  → ステータスバーに通知
```

## 保存タイミング

```
キー入力
  │
  ├─ 3秒間入力なし ──→ redb 一時保存（documents テーブル上書き）
  │
  ├─ 5分間編集なし ──→ リビジョン作成（ハッシュチェーン追加）
  │                        └──→ サーバー同期（有料、バックグラウンド）
  │
  ├─ Ctrl+S ────────→ リビジョン作成 → サーバー同期
  │
  ├─ ファイル添付 ──→ リビジョン作成 → blob アップロード
  │
  ├─ 署名 ─────────→ リビジョン作成 → 署名記録 → ドキュメントロック
  │
  └─ アプリ終了 ───→ リビジョン作成（未保存の変更があれば）
```

## 署名・承認フロー

### 鍵管理

```
無料版（ローカル）:
  初回起動時 → Ed25519 鍵ペア自動生成
            → パスフレーズ設定（署名時に毎回入力）
            → ~/.local/share/lovenote/key.pub

有料版（マネージドストレージ）:
  アカウント作成時 → サーバー側で鍵ペア生成・管理
                  → デバイス間で自動同期
```

### 署名フロー

```
1. 実験者: 記録完了 → Ctrl+S → リビジョン作成
2. 実験者: [署名] ボタン
   → 署名の意味を選択（Authorship）
   → パスフレーズ入力（無料版）/ アカウント認証（有料版）
   → Ed25519 で revision_hash に署名
   → SignatureRecord を保存
3. PI への共有:
   無料版 → .eln エクスポートして渡す（PDF 同梱）
   有料版 → Web ダッシュボードで一覧表示
4. PI: 内容確認 → [承認] ボタン
   → 署名の意味: Approval
   → Ed25519 で revision_hash に署名
   → ドキュメントがロック（読み取り専用）
5. アーカイブ: Typst → PDF/A 出力 + 署名アーカイブ ZIP
```

### PI の承認体験

```
無料版:
  → .eln ファイルを受け取る
  → ZIP 展開 → PDF で内容確認
  → PI も Love Note を持っていれば署名可能

有料版:
  → Web ダッシュボードに未承認ノートが一覧表示
  → プレビュー確認 → [承認] ボタン（一括承認も可能）
  → Love Note のインストール不要
```

## コラボレーション方針

リアルタイム共同編集は不要。実験ノートは個人の記録。

| 必要な共同作業 | 提供方法 |
|--------------|---------|
| PI レビュー・承認 | マネージドストレージの Web ビュー + 署名 |
| プロトコル共有 | テンプレートの共有リポジトリ |
| データ参照 | ノート間リンク / .eln エクスポート |
| チーム管理 | ダッシュボード（メンバーの実験一覧） |

## プラグインシステム

### 二層構造

| 層 | 技術 | 用途 | 例 |
|---|---|---|---|
| 組み込みブロック | Rust crate（コンパイル時） | 基本ブロック。GPUI に直接アクセス | text, heading, table, image |
| コミュニティプラグイン | Rhai スクリプト（実行時） | 分野特化ブロック。サンドボックス実行 | 試薬テーブル, PCR サイクル, ゲル電気泳動 |

### なぜ Rhai か

- プラグインの仕事は「スキーマ定義 + Typst コード生成」だけ。重い処理がない
- WASM はオーバースペック（wasmtime, WIT 定義の複雑さに見合わない）
- 動的ライブラリ (.so) は unsafe + ABI 不安定。実験ノートには不適
- Rhai はサンドボックス内で実行。ファイル/ネットワークアクセス不可
- 1ファイル数KB。全プラグイン合計でも 1MB 以下
- Rust ライクな構文で学びやすい
- ホットリロード可能（再起動不要）

### プラグインファイル構成

```
~/.local/share/lovenote/plugins/
├── reagent-table/
│   ├── manifest.toml        # メタデータ
│   ├── plugin.rhai           # ロジック
│   └── template.typ          # Typst テンプレート（任意）
├── pcr-cycle/
│   ├── manifest.toml
│   ├── plugin.rhai
│   └── template.typ
└── ...
```

### manifest.toml

```toml
id = "reagent-table"
name = "試薬テーブル"
version = "0.1.0"
author = "田中太郎"
category = "Science"
icon = "flask"
min_app_version = "1.0.0"
```

### plugin.rhai

```rust
fn field_schema() {
    [#{
        key: "reagents",
        label: "試薬一覧",
        type: "table",
        columns: [
            #{ key: "name", label: "試薬名", type: "text" },
            #{ key: "cas", label: "CAS番号", type: "text" },
            #{ key: "amount", label: "量", type: "number" },
            #{ key: "unit", label: "単位", type: "select",
               options: ["mg", "g", "mL", "μL", "mmol"] },
        ],
    }]
}

fn to_typst(data) {
    let result = `#import "template.typ": reagent-table\n`;
    result += "#reagent-table(\n";
    for row in data.reagents {
        result += `  ("${row.name}", "${row.cas}", "${row.amount} ${row.unit}"),\n`;
    }
    result += ")";
    result
}

fn validate(data) {
    if data.reagents.len() == 0 {
        return "試薬を1つ以上入力してください";
    }
    return true;
}
```

### Rhai サンドボックス

Rhai はデフォルトで外部アクセス手段を一切持たない:

```
Rhai にデフォルトで存在しないもの:
  ✗ ファイル読み書き
  ✗ ネットワークアクセス
  ✗ プロセス起動
  ✗ 環境変数アクセス
  ✗ FFI / ネイティブコード呼び出し

Rhai でできること:
  ✓ 変数、関数、制御構文
  ✓ 文字列操作
  ✓ 配列、マップ操作
  ✓ 数値計算
```

Love Note 側が明示的に登録した関数のみプラグインから呼び出し可能（ホワイトリスト方式）。

### プラグインホスト（Rust 側）

```rust
pub struct PluginHost {
    engine: rhai::Engine,
    plugins: HashMap<String, LoadedPlugin>,
}

struct LoadedPlugin {
    manifest: PluginManifest,
    ast: rhai::AST,
}

impl PluginHost {
    pub fn new() -> Self {
        let mut engine = rhai::Engine::new();

        // === 安全制限 ===
        engine.set_max_operations(10_000);      // 無限ループ防止
        engine.set_max_string_size(1_000_000);   // 1MB
        engine.set_max_array_size(10_000);
        engine.set_max_map_size(10_000);
        engine.set_max_modules(0);               // モジュールインポート禁止

        // === プラグインに公開する関数（ホワイトリスト） ===
        engine.register_fn("typst_table", make_typst_table);
        engine.register_fn("typst_figure", make_typst_figure);
        engine.register_fn("typst_math", make_typst_math);
        engine.register_fn("format_number", format_number);
        engine.register_fn("format_date", format_date);
        engine.register_fn("format_unit", format_unit);
        // fs, net, exec, env 等は一切登録しない

        Self { engine, plugins: HashMap::new() }
    }

    pub fn load_plugins(&mut self, dir: &Path) -> Result<()> {
        for entry in fs::read_dir(dir)? {
            let plugin_dir = entry?.path();
            let manifest: PluginManifest =
                toml::from_str(&fs::read_to_string(plugin_dir.join("manifest.toml"))?)?;

            // ハッシュ検証
            let rhai_bytes = fs::read(plugin_dir.join("plugin.rhai"))?;
            let hash = Sha256::digest(&rhai_bytes);
            if hash.as_slice() != manifest.hash {
                return Err(anyhow!("Plugin {} hash mismatch", manifest.id));
            }

            let ast = self.engine.compile_file(plugin_dir.join("plugin.rhai"))?;
            self.plugins.insert(manifest.id.clone(), LoadedPlugin { manifest, ast });
        }
        Ok(())
    }

    pub fn call_to_typst(&self, plugin_id: &str, data: rhai::Dynamic) -> Result<String> {
        let plugin = &self.plugins[plugin_id];
        self.engine.call_fn(
            &mut rhai::Scope::new(), &plugin.ast, "to_typst", (data,)
        )
    }

    pub fn call_field_schema(&self, plugin_id: &str) -> Result<rhai::Dynamic> {
        let plugin = &self.plugins[plugin_id];
        self.engine.call_fn(
            &mut rhai::Scope::new(), &plugin.ast, "field_schema", ()
        )
    }
}
```

### プラグイン配布（公式リポジトリ一括管理）

信頼性を重視し、全プラグインを公式リポジトリで一括管理する。

```
github.com/lovenote-plugins/registry
├── plugins.toml              # 全プラグインの一覧 + ハッシュ
├── reagent-table/
│   ├── manifest.toml
│   ├── plugin.rhai
│   └── template.typ
├── pcr-cycle/
│   ├── manifest.toml
│   ├── plugin.rhai
│   └── template.typ
└── ...
```

```toml
# plugins.toml（レジストリインデックス）
[[plugins]]
id = "reagent-table"
name = "試薬テーブル"
version = "0.1.0"
author = "田中太郎"
category = "Science"
verified = true              # Love Note チームがレビュー済み
hash = "sha256:ab3f..."      # plugin.rhai のハッシュ（改ざん検知）
```

信頼性の担保:

| 対策 | 内容 |
|------|------|
| コードレビュー | 公式リポジトリへの PR で全バージョンをレビュー |
| ハッシュ検証 | ダウンロード後に SHA-256 で改ざん検知 |
| Rhai サンドボックス | レビュー漏れがあっても外部アクセス不可 |
| 操作制限 | max_operations で無限ループ防止 |
| API ホワイトリスト | 登録した関数のみ呼び出し可能 |

インストールフロー:

```
アプリ内プラグインブラウザ
  → plugins.toml を取得 → 一覧表示
  → ユーザーが選択 → plugin.rhai + template.typ をダウンロード
  → SHA-256 ハッシュ検証
  → ~/.local/share/lovenote/plugins/ に配置
  → ホットリロード（再起動不要）
```

### 組み込みブロック（Rust trait）

基本ブロックのみ Rust で実装。GPUI を直接使える。

```rust
pub trait BlockContent: 'static {
    fn type_name(&self) -> &'static str;
    fn icon(&self) -> &'static str;
    fn category(&self) -> BlockCategory;
    fn field_schema(&self) -> Vec<FieldDef>;
    fn to_typst(&self, data: &BlockData) -> String;
    fn default_data(&self) -> BlockData;
}
```

### フォーム補助入力の流れ

```
"/" 入力 → ブロック選択パレット（組み込み + Rhai プラグイン一覧）
  → 例: 「試薬テーブル」を選択
  → field_schema() からフォーム UI を自動生成
  → ユーザーが値を入力
  → to_typst() で Typst コードを生成
  → エディタのカーソル位置に挿入
  → 以降は Typst ソースとして直接編集可能
```

## エディタレイアウト

左右分割: 左ペインが入力、右ペインがプレビュー。

```
┌──────────────────────────────┬──────────────────────────────────┐
│ 左ペイン: Typst ソース編集    │ 右ペイン: リアルタイムプレビュー    │
│                              │                                  │
│ --- frontmatter ---          │  ┌────────────────────────────┐  │
│ date: 2026-04-11             │  │                            │  │
│ template: pcr                │  │  2026-04-11 PCR実験         │  │
│ ---                          │  │                            │  │
│                              │  │  試薬                       │  │
│ = PCR実験                    │  │  ┌──────┬────┬─────┐      │  │
│                              │  │  │試薬名│ 量  │ 単位 │      │  │
│ == 試薬                      │  │  ├──────┼────┼─────┤      │  │
│ #reagent-table(              │  │  │KOD   │25  │ μL  │      │  │
│   ("KOD", "25", "μL"),       │  │  └──────┴────┴─────┘      │  │
│   ("Primer", "1.5", "μL"),   │  │                            │  │
│ )                            │  │  結果                       │  │
│                              │  │  バンドが確認された          │  │
│ == 結果                      │  │                            │  │
│ バンドが確認された             │  └────────────────────────────┘  │
│                              │                                  │
├──────────────────────────────┴──────────────────────────────────┤
│ リビジョン: #42 | 最終保存: 2分前 | 自動保存: ON                    │
└─────────────────────────────────────────────────────────────────┘
```

スラッシュコマンド "/" でフォーム補助入力を呼び出すと、左ペインにフォームが表示される。
入力完了後、Typst コードがカーソル位置に挿入され、以降は直接編集可能。

## Typst World 実装

```rust
struct LoveNoteWorld {
    /// 左ペインの現在のソース
    source: typst::Source,
    /// テンプレート・プラグインの Typst ファイル
    library_files: HashMap<FileId, Vec<u8>>,
    /// フォント
    fonts: Vec<typst::Font>,
    /// フォントブック
    book: LazyHash<FontBook>,
    /// 実験ディレクトリのパス
    experiment_dir: PathBuf,
    /// blob インデックス（大容量ファイル管理）
    blob_index: HashMap<PathBuf, BlobRef>,
}

impl typst::World for LoveNoteWorld {
    fn main(&self) -> Source {
        self.source.clone()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        // #import で参照されるテンプレートの .typ ファイル
        // templates/ や plugins/ から読み込み
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        let path = self.experiment_dir.join(self.resolve_path(id));

        // 1. ローカルにあればそのまま返す
        if path.exists() {
            return Ok(fs::read(&path)?.into());
        }

        // 2. blob_index を確認（大容量ファイル）
        if let Some(blob_ref) = self.blob_index.get(&path) {
            match &blob_ref.state {
                BlobState::Cached { local_path } => {
                    return Ok(fs::read(local_path)?.into());
                }
                BlobState::Remote => {
                    // プレビューにはサムネイルを返す
                    // バックグラウンドで元画像をダウンロード開始
                    return Ok(self.get_thumbnail(blob_ref)?.into());
                }
            }
        }

        Err(FileError::NotFound(path))
    }
}
```

### レンダリングパイプライン

```
左ペインのソースが変更
       ↓
  デバウンス（100ms）
       ↓
  LoveNoteWorld.source を更新
       ↓
  typst::compile(&world)     ← comemo が自動メモ化
       ↓                       変更部分のみ再コンパイル
  typst::Document
       ↓
  各ページを SVG or 画像に変換
       ↓
  右ペインに GPUI で描画
```

大容量画像がサーバーにしかない場合、プレビューにはサムネイルを表示。
PDF エクスポート時のみ元画像をダウンロードして使用。

## 画像取り込み

### 取り込み経路

| 方法 | コスト | Phase | ユースケース |
|------|--------|-------|------------|
| ドラッグ&ドロップ | なし | 1 | PC に既にある画像 |
| Ctrl+V（クリップボード） | なし | 1 | スクリーンショット、コピー済み画像 |
| QR コード LAN 転送 | なし | 1 | **実験中のスマホ写真（本命）** |
| 監視フォルダ | なし | 2 | Google Drive / Syncthing 経由 |
| Web アップロード | サーバー | 3 | 外出先からの送信（有料機能） |

### QR コード LAN 転送（メイン機能）

実験中にスマホで撮った写真を即座に取り込む。サーバー不要、アプリ不要（ブラウザのみ）。

```
┌─ デスクトップ (Love Note) ──────────────────────────────┐
│                                                         │
│  1. ツールバーの📷ボタン or "/" → "スマホから画像"          │
│     → ローカル HTTP サーバー起動 (例: 0.0.0.0:18080)     │
│     → QR コード表示（http://192.168.1.5:18080/upload）   │
│                                                         │
│  4. 画像を受信                                           │
│     → 実験ディレクトリにコピー                             │
│     → EXIF から撮影日時を抽出                              │
│     → サムネイル生成                                      │
│     → Typst コードをカーソル位置に挿入                     │
│     → HTTP サーバー終了                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↑ LAN ↓

┌─ スマホ（ブラウザ）─────────────────────────────────────┐
│                                                         │
│  2. QR コードをスキャン → ブラウザが開く                   │
│     → シンプルなアップロード画面                           │
│       ┌─────────────────────────────────┐               │
│       │  Love Note に画像を送信           │               │
│       │                                 │               │
│       │  [カメラで撮影]                  │               │
│       │  [ライブラリから選択]             │               │
│       │                                 │               │
│       │  キャプション: [____________]     │               │
│       │                                 │               │
│       │  [送信]                          │               │
│       └─────────────────────────────────┘               │
│                                                         │
│  3. 写真撮影 or 選択 → キャプション入力 → 送信             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 画像処理パイプライン

どの経路でも、受信後に同一のパイプラインを通る:

```
受信した画像
  │
  ├─ EXIF メタデータ抽出
  │   → 撮影日時（Typst のコメントに記録）
  │   → GPS 座標（プライバシー保護のため除去を推奨）
  │   → カメラ情報
  │
  ├─ 画像の最適化
  │   → 回転補正（EXIF Orientation に基づく）
  │   → リサイズ: 長辺 4096px 以下に（元画像は別途保管可能）
  │   → フォーマット変換: HEIC → JPEG
  │
  ├─ サイズ判定
  │   → ≤ 10MB: 実験ディレクトリにそのまま保存
  │   → > 10MB: blob 管理（サムネイルのみローカル保持）
  │
  ├─ サムネイル生成（プレビュー用、常にローカル）
  │
  └─ Typst コード生成 → エディタのカーソル位置に挿入
```

### 自動生成される Typst コード

```typst
// 画像1枚の場合
#figure(
  image("IMG_20260413_143022.jpg", width: 80%),
  caption: [ゲル電気泳動結果],  // ← ユーザーが入力したキャプション
) <fig-gel>

// 複数枚を一度に送った場合 → グリッド配置
#figure(
  grid(
    columns: 2,
    gutter: 8pt,
    image("sample-A.jpg"),
    image("sample-B.jpg"),
    image("sample-C.jpg"),
    image("sample-D.jpg"),
  ),
  caption: [各サンプルの外観比較],
) <fig-samples>
```

挿入後はカーソルがキャプション位置に移動し、すぐに説明を書ける。
右ペインのプレビューで即座に表示されるため、サイズや配置の調整がリアルタイムで可能。

## PDF レイアウト（実験ノートフォーマット）

### 設計方針

最小限のフォーマットで「実験ノートだ」と認識できるようにする。
装飾は最小限に抑え、本文領域は素のまま。

理由:
- PDF は「閲覧・アーカイブ・提出」用。編集は .typ ソースで行う
- 編集可能なソース（.typ）と閲覧用の成果物（PDF）が分離しているため、
  PDF の見た目を整えてもコピペ等の実害がない
- テンプレート1枚で全実験に自動適用。ユーザーの手間はゼロ

### PDF 出力レイアウト

```
┌─────────────────────────────────────────┐
│ Love Note                    2026-04-13 │  ← ヘッダー（自動）
│ PCR増幅実験                              │
│ 著者: 田中太郎  プロジェクト: RNA解析     │
├─────────────────────────────────────────┤
│                                         │
│  （本文 — ユーザーが書いた内容そのまま）    │
│                                         │
├─────────────────────────────────────────┤
│ リビジョン: #42 | ハッシュ: ab3f...cd     │  ← フッター（自動）
│ 署名: 田中太郎 (Authorship) 2026-04-13   │
└─────────────────────────────────────────┘
```

自動挿入される情報:
- **ヘッダー**: アプリ名、日付、タイトル、著者、プロジェクト名
- **フッター**: リビジョン番号、ハッシュ値（先頭8文字）、署名情報
- **本文**: ユーザーが書いた内容をそのまま出力（装飾なし）

### テンプレート実装

```typst
// lovenote-format.typ — 全実験に自動適用
#let lovenote(
  title: none,
  date: datetime.today(),
  author: none,
  project: none,
  revision: none,
  hash: none,
  signatures: (),
  body,
) = {
  set page(
    header: {
      grid(
        columns: (1fr, auto),
        text(fill: gray, size: 9pt)[Love Note],
        text(fill: gray, size: 9pt)[#date.display("[year]-[month]-[day]")],
      )
      if title != none { text(size: 14pt, weight: "bold")[#title] }
      if author != none or project != none {
        text(size: 9pt, fill: gray)[
          #if author != none [著者: #author]
          #if project != none [  プロジェクト: #project]
        ]
      }
      line(length: 100%, stroke: 0.5pt + gray)
    },
    footer: {
      line(length: 100%, stroke: 0.5pt + gray)
      text(size: 8pt, fill: gray)[
        #if revision != none [リビジョン: \##revision]
        #if hash != none [ | ハッシュ: #hash]
        #for sig in signatures [
          \ 署名: #sig.signer (#sig.meaning) #sig.date
        ]
      ]
    },
  )
  body
}
```

ユーザーが書くのは frontmatter だけ。ヘッダー・フッターは自動生成される:

```typst
// main.typ — ユーザーが書く内容
#import "../templates/lovenote-format.typ": lovenote
#show: lovenote.with(
  title: "PCR増幅実験",
  author: "田中太郎",
  project: "RNA解析",
)

= 試薬
...
```

frontmatter の author, date 等はアプリが実験作成時に自動挿入するため、
ユーザーが手動で記入する必要はない（フールプルーフ）。

## エクスポート

| 形式 | 用途 |
|------|------|
| PDF/A | アーカイブ・提出・印刷 |
| .eln (RO-Crate) | 他 ELN との相互運用・PI への共有 |
| 署名アーカイブ ZIP | 第三者検証用（data.json + .sig + pubkey） |

### .eln ファイルフォーマット

ELN Consortium が策定した標準フォーマット。実体は ZIP + JSON-LD メタデータ（RO-Crate 仕様）。

```
experiment.eln (ZIP)
├── ro-crate-metadata.json          # JSON-LD メタデータ（誰が・いつ・何を）
├── ro-crate-preview.html           # ブラウザで開けるプレビュー
├── 2026-04-11_pcr/
│   ├── main.typ                    # Typst ソース（編集用）
│   ├── main.pdf                    # レンダリング済み PDF（閲覧用）
│   ├── gel-image.tiff              # 画像
│   └── results.csv                 # データ
└── 2026-04-11_western/
    ├── main.typ
    ├── main.pdf
    └── membrane.tiff
```

Typst ソースだけでは相手が読めないため、**PDF を同梱**する:
- main.typ = 編集可能なソース（Love Note ユーザー向け）
- main.pdf = レンダリング済み成果物（誰でも閲覧可能）

| 受け取る側 | 開き方 |
|-----------|--------|
| Love Note ユーザー | main.typ をインポートして編集 |
| eLabFTW / RSpace ユーザー | .eln としてインポート、PDF で内容確認 |
| PI（ツールなし） | ZIP 展開 → main.pdf を開くだけ |
| ブラウザ | ro-crate-preview.html を開く |
| 将来の誰か | PDF は数十年後でも読める |

エクスポートフロー:
```
1. Typst ソース → PDF レンダリング（typst crate）
2. HTML プレビュー生成
3. ro-crate-metadata.json 生成（schema.org 語彙、ORCID、所属機関等）
4. ZIP にまとめて .eln として保存
```

Love Note の実験ディレクトリ構造がそのまま .eln の構造に対応するため、
エクスポートは実質 PDF 生成 + ZIP 化 + メタデータ生成のみ。

## インポート・移行

### 設計方針: 「変換しない。格納する」

過去のデータを Typst に変換するのは非現実的:

| 元形式 | Typst 変換 | 理由 |
|--------|-----------|------|
| Word/Excel | 不可能 | 表・図・マクロ・変更履歴の変換精度が低すぎる |
| 紙ノートのスキャン | 不可能 | OCR しても Typst 構文に変換する意味がない |
| 他 ELN（HTML/リッチテキスト） | 不可能 | 自動変換は実用レベルにならない |
| LaTeX | **可能** | 構文が近い。自動変換 + 手動修正で移行できる |

方針: 過去のファイルは変換せず、Typst がそれらを参照するインデックスになる。

### インデックスとしての main.typ

```typst
// 2020-2025_legacy-import/main.typ — 過去データのインデックス

= 過去の実験記録（2020年〜2025年）

このディレクトリは Love Note 導入前の記録を格納したアーカイブです。
元ファイルはそのまま保持されており、変換は行っていません。

== 2024年

=== PCR最適化実験（2024-03-15）
- 元ファイル: #link("2024-03-15_pcr/report.docx")[report.docx]
- データ: #link("2024-03-15_pcr/results.xlsx")[results.xlsx]
- 写真: #figure(image("2024-03-15_pcr/gel.jpg", width: 60%))

=== ウェスタンブロット（2024-03-20）
- 元ファイル: #link("2024-03-20_wb/notebook-scan.pdf")[ノートスキャン]
```

### インポートウィザード

```
ファイル → 過去データのインポート

  ステップ1: フォルダを選択
    → ドラッグ&ドロップ or フォルダピッカー

  ステップ2: ファイルの自動分類
    アプリが中身をスキャンして分類:
    ┌────────────────────────────────────────────┐
    │ 検出されたファイル:                           │
    │                                            │
    │ 📄 Word/Excel    12件                       │
    │ 🖼  画像          45件                       │
    │ 📊 CSV/TSV        8件                       │
    │ 📑 PDF            5件                       │
    │ 📝 LaTeX          3件  ← Typst 変換可能      │
    │ ❓ その他          2件                       │
    │                                            │
    │ 合計: 75件, 1.2GB                           │
    └────────────────────────────────────────────┘

  ステップ3: グルーピング
    → 日付やフォルダ構造から実験単位を推定
    → ユーザーが確認・修正

  ステップ4: インポート実行
    → 実験ディレクトリを作成
    → ファイルをコピー
    → 各ディレクトリに main.typ を自動生成（インデックス）
    → redb に登録
    → リビジョン作成（change_summary: "レガシーデータのインポート"）
```

### LaTeX → Typst 変換

LaTeX のみ構文が近いため自動変換が現実的:

```
\section{実験方法}     →  = 実験方法
\textbf{重要}         →  *重要*
\begin{equation}      →  $ ... $
\includegraphics{...} →  #image("...")
\begin{tabular}{...}  →  #table(...)
```

ただし完璧ではないため:
- 自動変換 + 元の .tex を添付ファイルとして保持
- ユーザーに「変換結果を確認してください」と促す

### .eln インポート

他の ELN からエクスポートされた .eln ファイル（RO-Crate）を取り込む:

```
.eln ファイルを選択
  → ZIP 展開
  → ro-crate-metadata.json からメタデータ抽出（日付、著者、タイトル）
  → 実験ディレクトリを作成
  → PDF やデータファイルを格納
  → main.typ を自動生成（メタデータ + ファイルへのリンク）
  → redb に登録
```

### ユーザーへのメッセージ

```
「過去のデータを Typst に書き直す必要はありません。
 Love Note に取り込めば、検索・参照・署名の対象になります。
 新しい実験から Typst で書き始めてください。」
```

## クロスプラットフォーム対応

対象: Windows, Linux, macOS

### Pure Rust の恩恵

ほとんどの層はクロスプラットフォームで問題なし:

| コンポーネント | 互換性 | 理由 |
|--------------|--------|------|
| redb | 問題なし | Pure Rust、バイナリフォーマットはプラットフォーム非依存 |
| Typst エンジン | 問題なし | Pure Rust、フォントさえ揃えば同一出力 |
| Ed25519 署名 | 問題なし | ed25519-dalek は Pure Rust |
| SHA-256 ハッシュ | 問題なし | sha2 crate は Pure Rust |
| Rhai プラグイン | 問題なし | Pure Rust のスクリプトエンジン |
| .eln エクスポート | 問題なし | ZIP + JSON は普遍的 |

### 対策が必要な箇所

| リスク | 深刻度 | 対策 |
|--------|--------|------|
| 日本語入力（IME） | 高 | GPUI の上流（Zed）に依存。対応状況を追跡 |
| フォント差異 | 中 | Noto フォントをバンドルして統一（後述） |
| ファイルパス | 低 | `dirs` crate + 内部は相対パス + "/" 統一 |
| 改行コード | 低 | Typst は LF/CRLF 両対応 |
| ファイル名制約 | 低 | スラッグ生成時に安全な文字のみ使用 |

### フォントバンドル

同じ Typst ソースでも OS のフォントが違えばレイアウトが変わる。
Love Note にフォントをバンドルして全プラットフォームで同一出力を保証する。

```
バンドルフォント:
  - Noto Sans / Noto Sans CJK JP（本文）
  - Noto Sans Mono（コード）
  - Noto Sans Math（数式）

バイナリサイズ: +20-30MB
→ 互換性の方が重要
```

### ファイルパス規則

```
redb / リビジョン内のパス:
  → 常にワークスペースからの相対パス + "/" 区切り
  → 絶対パスを保存しない

実験ディレクトリ名:
  → ASCII 英数字 + ハイフン + アンダースコアのみ
  → "2026-04-11_pcr-amplification"（全 OS で安全）

Typst ソース内:
  #image("gel-image.tiff")        → 相対パス、全 OS で動作
  #import "../templates/pcr.typ"  → "/" 区切り、全 OS で動作
```

## フェーズ

### Phase 1: コア ELN（MVP）

- [ ] Typst エディタ（ソース編集 + リアルタイムプレビュー）
- [ ] redb ストレージ（documents + revisions + ハッシュチェーン）
- [ ] 保存レイヤー（一時保存 + リビジョン作成）
- [ ] テンプレートシステム（templates/ + #import）
- [ ] スラッシュコマンド + フォーム補助入力
- [ ] 基本ブロック: テキスト、見出し、テーブル、プロトコルステップ
- [ ] blob 管理（ローカルファイル添付）
- [ ] 画像取り込み（ドラッグ&ドロップ、Ctrl+V、QR コード LAN 転送）

### Phase 2: 信頼性

- [ ] 電子署名（Ed25519）
- [ ] ハッシュチェーン検証 UI
- [ ] ドキュメントロック（署名後の読み取り専用化）
- [ ] PDF/A エクスポート
- [ ] .eln (RO-Crate) エクスポート

### Phase 3: マネージドストレージ（有料サービス）

- [ ] サーバー同期プロトコル
- [ ] RFC 3161 TSA タイムスタンプ（サーバー側付与）
- [ ] blob のサーバー保管 + 遅延ダウンロード
- [ ] PI 向け Web ビュー（閲覧・署名）
- [ ] チーム共有・閲覧権限管理

### Phase 4: エコシステム

- [ ] 全文検索（tantivy）
- [ ] 科学系ブロック（試薬テーブル、PCR サイクル 等）
- [ ] CSV インポート（列マッピング付き）
- [ ] テンプレート共有リポジトリ
- [ ] チームダッシュボード

### Phase 5: ターゲット拡大（需要が確認されたら）

- [ ] GUI エディタモード（Typst を知らなくても使える Notion 風 UI）
- [ ] 内部では Typst にコンパイルされるが、ユーザーは意識しない
- [ ] 生物・化学向けブロック（ChemDraw 連携等）
- [ ] ターゲットを LaTeX/Typst 文化圏以外に拡大

## ディレクトリ構造

```
love_note/
├── Cargo.toml
├── crates/
│   ├── love-note/                   # メインアプリケーション
│   │   └── src/
│   │       ├── main.rs
│   │       ├── app.rs
│   │       ├── editor/
│   │       │   ├── mod.rs           # Typst エディタ
│   │       │   ├── highlight.rs     # シンタックスハイライト
│   │       │   └── preview.rs       # Typst プレビュー
│   │       ├── block/
│   │       │   ├── mod.rs           # BlockContent trait
│   │       │   ├── registry.rs      # BlockRegistry（組み込み + Rhai 統合）
│   │       │   ├── text.rs          # 組み込み: テキスト
│   │       │   ├── heading.rs       # 組み込み: 見出し
│   │       │   ├── table.rs         # 組み込み: テーブル
│   │       │   └── image.rs         # 組み込み: 画像
│   │       ├── plugin/
│   │       │   ├── mod.rs           # PluginHost（Rhai エンジン）
│   │       │   ├── host.rs          # プラグインロード・実行
│   │       │   └── manifest.rs      # manifest.toml パーサー
│   │       ├── storage/
│   │       │   ├── mod.rs
│   │       │   ├── redb_store.rs    # redb 操作
│   │       │   ├── revision.rs      # リビジョン + ハッシュチェーン
│   │       │   ├── signature.rs     # 電子署名
│   │       │   └── blob.rs          # 添付ファイル管理
│   │       ├── sync/
│   │       │   ├── mod.rs           # 同期クライアント (Phase 3)
│   │       │   └── queue.rs         # 同期キュー
│   │       └── export/
│   │           ├── pdf.rs           # PDF/A エクスポート
│   │           └── eln.rs           # .eln (RO-Crate) エクスポート
│   │
│   └── love-note-server/            # マネージドストレージ (Phase 3)
│       └── src/
│           └── main.rs
│
├── templates/                       # 実験テンプレート
│   ├── general.typ
│   ├── pcr.typ
│   └── components/
│       ├── reagent-table.typ
│       └── protocol-step.typ
│
└── docs/
    ├── architecture-v3.md           # このドキュメント
    └── eln-research-summary.md      # 調査まとめ
```

## 参考

- [eLabFTW](https://github.com/elabftw/elabftw) — RFC 3161 TSA, minisign 署名の実装参考
- [Typst](https://github.com/typst/typst) — レンダリングエンジン
- [redb](https://docs.rs/redb) — ローカル KV ストア
- [ed25519-dalek](https://docs.rs/ed25519-dalek) — 電子署名
- [tantivy](https://github.com/quickwit-oss/tantivy) — 全文検索
- [ELN File Format](https://github.com/TheELNConsortium/TheELNFileFormat) — .eln 仕様
