# Love Note 実装チェックリスト

Typst ベース ELN の実装進捗。

---

## Phase 0: 旧コード削除 + デバッグ基盤 — 完了

- [x] 旧ブロックシステム削除（block/, editor.rs, plugin-api）
- [x] tracing 導入（RUST_LOG 対応）
- [x] TypstDocument モデル + Storage CRUD
- [x] Storage テスト（7件）
- [x] storage-inspector バイナリ

## Phase 1: Typst ソースエディタ — 完了

- [x] TypstEditor コンポーネント（multi-line, soft-wrap）
- [x] Ctrl+S 保存（redb + .typ ファイル + リビジョン作成）
- [ ] アプリ終了時の自動保存

## Phase 2: Typst プレビュー — 完了

- [x] typst::World 実装（LoveNoteWorld + フォントロード）
- [x] Preview コンポーネント（typst_render でピクセルレンダリング）
- [x] 2ペイン→3ペインレイアウト（サイドバー | エディタ | プレビュー）
- [x] エラー時は前回のプレビューを保持
- [x] World キャッシュ（フォント再ロード防止）
- [ ] デバウンス（100ms）

## Phase 3: ワークスペース構造 — 完了

- [x] Workspace マネージャ（実験ディレクトリ作成/一覧/読み書き）
- [x] スラッグ生成（ASCII 安全、重複時 -2, -3 サフィックス）
- [x] 実験一覧サイドバー（ExperimentList）
- [x] クリックで実験切り替え（observe パターン）
- [x] "+ New" ボタンで新規実験作成
- [x] 右クリックコンテキストメニュー → Rename（Enter/Escape）
- [x] delete_experiment / rename_experiment（バックエンド）

## Phase 4: ハッシュチェーン・リビジョン — 完了

- [x] Revision モデル + SHA-256 ハッシュ計算（8テスト）
- [x] redb テーブル（REVISIONS, REVISION_INDEX）
- [x] create_revision / list_revisions / verify_chain
- [x] Ctrl+S でリビジョン自動作成
- [x] storage-inspector にリビジョン表示 + --verify フラグ
- [ ] 5分非アクティブでリビジョン作成（タイマー）
- [ ] アプリ終了時にリビジョン作成

## Phase 5: 電子署名 — バックエンド完了

- [x] Ed25519 鍵管理（KeyStore: 生成/保存/ロード、5テスト）
- [x] SignatureRecord モデル + redb SIGNATURES テーブル（2テスト）
- [ ] 署名 UI（署名ボタン、意味選択、ロック）

## Phase 6: ファイル監視 — バックエンド完了

- [x] FileWatcher（notify crate、リアルタイム検知、3テスト）
- [x] check_external_changes（起動時の差分チェック）
- [ ] 差分処理 UI（取り込む / 元に戻す ダイアログ）

## Phase 7: Rhai プラグイン — バックエンド完了

- [x] PluginHost（Rhai エンジン、安全制限、6テスト）
- [x] manifest.toml + plugin.rhai ロード
- [x] field_schema / to_typst / validate 呼び出し
- [x] 無限ループ防止（max_operations）
- [ ] スラッシュコマンド UI

## Phase 8: 画像取り込み — パイプライン完了

- [x] 画像処理パイプライン（リサイズ、EXIF 抽出、3テスト）
- [x] Typst #figure コード生成
- [ ] ドラッグ&ドロップ + Ctrl+V
- [ ] QR コード LAN 転送

## Phase 9: 仕上げ — 完了

- [x] PDF エクスポート（typst-pdf、3テスト）
- [x] ステータスバー（Export PDF ボタン + メッセージ表示）
- [x] タイトルバー（最小化 / 最大化 / 閉じる）
- [x] CLAUDE.md 更新

## 未実装（将来）

- [ ] 未保存状態のインジケータ（ステータスバーに表示）
- [ ] lovenote-format.typ テンプレート（ヘッダー + フッター）
- [ ] .eln (RO-Crate) エクスポート
- [ ] 全文検索（tantivy）
- [ ] GUI エディタモード（Notion 風）
- [ ] インポートウィザード
