# Love Note 実装チェックリスト

ブロックエディタ → Typst ベース ELN へのピボット。
各項目は1コミット単位。上から順に実装し、チェックを入れていく。

---

## Phase 0: 旧コード削除 + デバッグ基盤

### 0.1 旧ブロックシステム削除
- [x] `src/block/mod.rs`, `src/block/text.rs`, `src/block/heading.rs` を削除
- [x] `src/block/` ディレクトリを削除
- [x] `src/editor.rs` を削除
- [x] `src/storage/document.rs` を削除（旧 Document/StoredBlock モデル）
- [x] `src/lib.rs` から旧モジュールの参照を削除
- [x] `src/storage/mod.rs` から旧 re-export を削除
- [x] `src/storage/redb_store.rs` から旧 Document 関連メソッドを削除
- [x] `love-note-plugin-api` クレートを削除（ワークスペースから除外）
- [x] `main.rs` を最小構成に（GPUI 初期化 + 空ウィンドウ表示のみ）
- [x] 検証: `cargo build` が通る

### 0.2 tracing 導入
- [x] `Cargo.toml`（ワークスペース）に `tracing`, `tracing-subscriber` を追加
- [x] `crates/love-note/Cargo.toml` に tracing 依存を追加
- [x] `main.rs` で `tracing_subscriber::init()` を `Application::new()` の前に呼ぶ
- [x] 検証: `RUST_LOG=love_note=debug cargo run` でログ出力確認

### 0.3 新ドキュメントモデル + Storage
- [x] `src/storage/document.rs` を新規作成 — `TypstDocument` 構造体（id, title, content, frontmatter, locked, locked_by, created_at, updated_at）
- [x] `src/storage/mod.rs` に re-export 追加
- [x] `src/storage/redb_store.rs` を書き直し — TypstDocument 用の CRUD メソッド
- [x] `Storage::open_at(path: PathBuf)` メソッド追加（テスト用に任意パスを指定可能）
- [x] 既存の `Storage::open()` を `open_at` のラッパーに

### 0.4 Storage テスト
- [x] `Cargo.toml`（love-note）に `tempfile` を dev-dependency として追加
- [x] `crates/love-note/tests/storage_tests.rs` を作成
- [x] テスト: ドキュメント作成 → 保存 → ロードで内容一致
- [x] テスト: ドキュメント一覧取得で件数一致
- [x] テスト: ドキュメント削除後にロードで None
- [x] テスト: 存在しない ID のロードで None
- [x] テスト: 複数ドキュメントの保存・一覧
- [x] 検証: `cargo test` 全件パス

### 0.5 storage-inspector バイナリ
- [x] `crates/love-note/src/bin/storage_inspector.rs` を作成
- [x] コマンドライン引数でDBパスを指定可能に（デフォルトは通常パス）
- [x] 全ドキュメントの ID, タイトル, content の先頭50文字, 更新日時を表示
- [x] 検証: `cargo run --bin storage-inspector` でDB内容がダンプされる

---

## Phase 1: Typst ソースエディタ（左ペイン）

### 1.1 TypstEditor コンポーネント
- [x] `src/typst_editor.rs` を作成
- [x] `TypstEditor` 構造体: document (TypstDocument), input (Entity<InputState>), storage (Arc<Storage>)
- [x] `impl Render for TypstEditor` — 単一の InputState をフルサイズで表示
- [x] モノスペースフォント設定
- [x] TypstDocument の content を InputState に反映
- [x] `src/lib.rs` に `pub mod typst_editor` 追加

### 1.2 保存機能
- [x] Ctrl+S キーバインディング → `save_document()` メソッド呼び出し
- [x] `save_document()`: InputState のテキストを TypstDocument.content に反映 → redb 保存
- [x] 保存時に `tracing::info!("Document saved", doc_id = %id)` ログ
- [ ] アプリ終了時（フォーカス喪失時）の自動保存

### 1.3 main.rs の接続
- [x] `main.rs` で `TypstEditor` を使用
- [x] 起動時: TypstDocument が存在すればロード、なければデフォルト作成
- [ ] 検証: `cargo run` → テキスト入力 → 再起動 → 内容が永続化されている

---

## Phase 2: Typst プレビュー（右ペイン）

### 2.1 依存追加
- [x] `Cargo.toml`（ワークスペース）に `typst`, `typst-render`, `typst-pdf`, `comemo` 追加
- [x] `crates/love-note/Cargo.toml` に依存追加
- [x] `cargo build` が通ることを確認

### 2.2 LoveNoteWorld（typst::World 実装）
- [x] `src/typst_world.rs` を作成
- [x] `LoveNoteWorld` 構造体: source, fonts, book
- [x] `impl typst::World for LoveNoteWorld` — `main()`, `library()`, `book()`, `font()` を実装
- [x] `source()` — 現時点ではメインソースのみ（#import 未対応）
- [x] `file()` — 現時点では FileError::NotFound を返す
- [x] システムフォントのロード
- [x] テスト: `= Hello\n\nWorld` をコンパイルして typst::Document が得られる
- [x] 検証: `cargo test` パス

### 2.3 Preview コンポーネント
- [x] `src/preview.rs` を作成
- [x] `Preview` 構造体: pages (レンダリング済み画像データ)
- [x] `typst_render` でページをピクセルバッファにレンダリング
- [x] GPUI の `img()` または `canvas()` で表示
- [x] スクロール可能なコンテナで複数ページ対応
- [x] コンパイルエラー時はエラーメッセージをテキスト表示

### 2.4 2ペインレイアウト
- [x] `src/workspace_view.rs` を作成
- [x] `WorkspaceView` 構造体: editor (Entity<TypstEditor>), preview (Entity<Preview>)
- [x] 左右分割レイアウト（flex_row, 50:50）
- [ ] エディタのテキスト変更 → 100ms デバウンス → コンパイル → プレビュー更新
- [x] `main.rs` を `WorkspaceView` に切り替え
- [ ] 検証: `cargo run` → Typst 入力 → 右ペインにプレビュー表示

### 2.5 エラー表示
- [x] Typst コンパイルエラーをプレビューペインに表示
- [x] エラー時は直前の成功プレビューを保持 + エラーメッセージをオーバーレイ
- [x] `tracing::warn!` でコンパイルエラーをログ
- [ ] 検証: 不正な Typst 構文を入力 → エラーが表示され、前回のプレビューが残る

---

## Phase 3: ワークスペース構造

### 3.1 ワークスペースマネージャ
- [x] `src/workspace.rs` を作成
- [x] `Workspace` 構造体: root_dir (PathBuf)
- [x] `create_experiment(name: &str) -> PathBuf` — `{日付}_{スラッグ}/` ディレクトリ作成 + `main.typ` 生成
- [x] スラッグ生成: ASCII 英数字 + ハイフンのみ
- [x] `list_experiments() -> Vec<ExperimentInfo>` — ディレクトリスキャン
- [x] `ExperimentInfo` 構造体: path, name, date, last_modified
- [x] テスト: 実験作成 → ディレクトリと main.typ が存在する
- [x] テスト: 複数実験の一覧取得

### 3.2 TypstDocument とワークスペースの接続
- [x] TypstDocument の保存時に workspace/ の .typ ファイルも同時更新
- [x] 起動時に workspace/ から実験一覧をロード
- [x] redb と .typ ファイルの両方を正本の一部として管理

### 3.3 実験一覧サイドバー
- [x] `src/experiment_list.rs` を作成
- [x] `ExperimentList` コンポーネント: 実験名と日付の一覧表示
- [x] クリックで実験を開く（エディタ + プレビューの内容を切り替え）
- [x] 「新しい実験」ボタン → 名前入力 → ディレクトリ作成
- [x] `WorkspaceView` にサイドバーを統合（3カラム: サイドバー | エディタ | プレビュー）
- [ ] 検証: 新規実験作成 → ファイルシステムに反映 → 一覧に表示

---

## Phase 4: ハッシュチェーン・リビジョン

### 4.1 Revision データモデル
- [ ] `src/storage/revision.rs` を作成
- [ ] `Revision` 構造体: hash, prev_hash, sequence, doc_id, content, frontmatter, author, timestamp, tsa_token, change_summary
- [ ] `ChainStatus` enum: Valid, Tampered { seq }, BrokenChain { seq }
- [ ] Serialize/Deserialize を derive

### 4.2 ハッシュ計算
- [ ] `Cargo.toml` に `sha2` 追加（typst が依存していなければ）
- [ ] `compute_hash(rev: &Revision) -> [u8; 32]` 関数
- [ ] prev_hash + doc_id + sequence + content + author + timestamp を連結して SHA-256
- [ ] テスト: 同一入力で同一ハッシュ
- [ ] テスト: 1バイトでも変わればハッシュが変わる

### 4.3 リビジョン Storage
- [ ] `redb_store.rs` に `REVISIONS_TABLE`, `REVISION_INDEX_TABLE` 追加
- [ ] `create_revision(doc_id, content, author) -> Revision` — prev_hash をチェーンの末尾から取得
- [ ] `load_revision(hash: [u8; 32]) -> Option<Revision>`
- [ ] `list_revisions(doc_id: Uuid) -> Vec<Revision>` — sequence 順
- [ ] `get_latest_revision(doc_id: Uuid) -> Option<Revision>`

### 4.4 チェーン検証
- [ ] `verify_chain(doc_id: Uuid) -> ChainStatus` 関数
- [ ] 全リビジョンを sequence 順に走査 → 各 hash を再計算 → prev_hash の連続性を検証
- [ ] テスト: 10件のリビジョンチェーン → Valid
- [ ] テスト: 中間リビジョンの content を改ざん → Tampered { seq: N }
- [ ] テスト: prev_hash を不正な値に変更 → BrokenChain { seq: N }

### 4.5 リビジョン作成トリガー
- [ ] `typst_editor.rs`: Ctrl+S でリビジョン作成
- [ ] 5分間非アクティブでリビジョン作成（タイマー）
- [ ] アプリ終了時にリビジョン作成（未保存の変更があれば）
- [ ] `tracing::info!("Revision created", seq = rev.sequence)` ログ
- [ ] 検証: Ctrl+S 数回 → `storage-inspector` でリビジョン一覧確認

### 4.6 storage-inspector のリビジョン対応
- [ ] storage-inspector にリビジョン一覧表示を追加
- [ ] ハッシュチェーン検証結果を表示
- [ ] 検証: `cargo run --bin storage-inspector -- --verify` でチェーン検証

---

## Phase 5: 電子署名

### 5.1 鍵管理
- [ ] `Cargo.toml` に `ed25519-dalek`, `rand` 追加
- [ ] `src/crypto/mod.rs` を作成（pub mod keystore）
- [ ] `src/crypto/keystore.rs` を作成
- [ ] `generate_keypair() -> (SigningKey, VerifyingKey)` 関数
- [ ] `save_keypair(path, keypair, passphrase)` — 暗号化してファイル保存
- [ ] `load_keypair(path, passphrase) -> SigningKey` — 復号してロード
- [ ] テスト: 鍵生成 → 保存 → ロード → 同一鍵
- [ ] テスト: 不正パスフレーズでロード失敗

### 5.2 署名記録
- [ ] `src/storage/signature.rs` を作成
- [ ] `SignatureRecord` 構造体: revision_hash, meaning, signature, public_key, signer, signed_at, tsa_token
- [ ] `SignatureMeaning` enum: Authorship, Approval, Review
- [ ] `redb_store.rs` に `SIGNATURES_TABLE` 追加
- [ ] `sign_revision(revision_hash, meaning, signing_key) -> SignatureRecord`
- [ ] `verify_signature(record) -> bool`
- [ ] テスト: 署名 → 検証成功
- [ ] テスト: 改ざん後の署名検証 → 失敗

### 5.3 署名 UI
- [ ] `workspace_view.rs` に署名ボタン追加
- [ ] 署名前チェック: コンパイルエラーなし、未保存変更なし
- [ ] 署名の意味選択ダイアログ（Authorship / Approval / Review）
- [ ] 署名後のドキュメントロック（locked = true）
- [ ] ロック中はエディタを読み取り専用に
- [ ] 検証: 署名 → ドキュメントが編集不可になる

---

## Phase 6: ファイル監視

### 6.1 ファイルウォッチャー
- [ ] `Cargo.toml` に `notify` 追加
- [ ] `src/file_watcher.rs` を作成
- [ ] `FileWatcher` 構造体: watcher (RecommendedWatcher), event_rx
- [ ] `watch(workspace_dir)` — workspace/ 以下を再帰監視
- [ ] `.typ` ファイルの Modify, Create, Remove イベントをフィルタ

### 6.2 起動時の差分チェック
- [ ] `workspace.rs` に `check_external_changes() -> Vec<ChangedFile>` 追加
- [ ] 各 .typ ファイルの内容と redb の documents テーブルを比較
- [ ] テスト: .typ を直接書き換え → 差分検出

### 6.3 差分処理 UI
- [ ] 起動時に差分があれば通知ダイアログ表示
- [ ] 「変更を取り込む」→ .typ の内容で新リビジョン作成
- [ ] 「元に戻す」→ redb の内容で .typ を上書き
- [ ] 起動中の外部変更検知 → ステータスバーに通知
- [ ] 検証: 外部で .typ を編集 → Love Note が検知

---

## Phase 7: Rhai プラグイン

### 7.1 プラグインホスト
- [ ] `Cargo.toml` に `rhai`, `toml` 追加
- [ ] `src/plugin/mod.rs` を作成（pub mod host, manifest）
- [ ] `src/plugin/manifest.rs` — `PluginManifest` (toml デシリアライズ)
- [ ] `src/plugin/host.rs` — `PluginHost` 構造体
- [ ] Rhai エンジンの安全制限設定（max_operations, max_string_size 等）
- [ ] ホワイトリスト関数の登録（typst_table, typst_figure 等）

### 7.2 プラグインのロード・実行
- [ ] `load_plugins(dir: &Path)` — manifest.toml + plugin.rhai 読み込み
- [ ] SHA-256 ハッシュ検証
- [ ] `call_field_schema(plugin_id)` → フォームスキーマ取得
- [ ] `call_to_typst(plugin_id, data)` → Typst コード生成
- [ ] テスト: サンプルプラグインのロード・実行
- [ ] テスト: max_operations 超過で無限ループ検知

### 7.3 スラッシュコマンド UI
- [ ] エディタで "/" 入力を検知
- [ ] プラグインパレット表示
- [ ] プラグイン選択 → field_schema からフォーム UI を動的生成
- [ ] フォーム入力完了 → to_typst() → カーソル位置に Typst コード挿入
- [ ] 検証: "/" → プラグイン選択 → Typst コード挿入

---

## Phase 8: 画像取り込み

### 8.1 画像処理パイプライン
- [ ] `Cargo.toml` に `image`, `kamadak-exif` 追加
- [ ] `src/image_capture/mod.rs` を作成
- [ ] `src/image_capture/pipeline.rs` — EXIF 抽出、回転補正、リサイズ、サムネイル生成
- [ ] テスト: パイプラインの各ステップ

### 8.2 ドラッグ&ドロップ + Ctrl+V
- [ ] ドラッグ&ドロップで画像を実験ディレクトリにコピー → Typst コード挿入
- [ ] Ctrl+V でクリップボード画像を保存 → Typst コード挿入
- [ ] 検証: 画像ドロップ → プレビューに表示

### 8.3 QR コード LAN 転送
- [ ] `Cargo.toml` に `qrcode`, `axum` 追加
- [ ] `src/image_capture/qr_server.rs` — ローカル HTTP サーバー
- [ ] ワンタイムトークン生成
- [ ] QR コード生成・表示 UI
- [ ] アップロード用 HTML ページ配信
- [ ] 画像受信 → パイプライン → Typst コード挿入 → サーバー停止
- [ ] 検証: スマホから画像アップロード → Love Note に反映

---

## Phase 9: 仕上げ

### 9.1 PDF エクスポート
- [ ] `src/export/mod.rs`, `src/export/pdf.rs` を作成
- [ ] typst-pdf でPDF/A 出力
- [ ] lovenote-format.typ テンプレート（ヘッダー + フッター自動挿入）
- [ ] エクスポートボタン UI
- [ ] 検証: エクスポート → PDF ファイルが生成

### 9.2 ステータスバー
- [ ] `workspace_view.rs` の下部にステータスバー追加
- [ ] リビジョン番号、最終保存時刻、チェーン状態アイコン、署名状態

### 9.3 ドキュメント更新
- [ ] CLAUDE.md を更新
- [ ] README.md を更新
- [ ] architecture-v3.md の Phase 1 チェックリストを実装状況で更新
