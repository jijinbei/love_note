# Love Note 電子実験ノート化 — 調査まとめ

日付: 2026-04-11

## 1. ビジョン

Love Note を Typst ベースの電子実験ノート（ELN）として再構築する。
ターゲット: **アカデミア**（科研費レベルの要件）。
初期ターゲット: **LaTeX/Typst 文化圏の研究者**（物理、数学、計算科学、情報科学）。
生物・化学は Word/GUI 文化のため、GUI モード追加後（Phase 5）に拡大。

### 収益モデル（決定済み）

データ管理（ストレージ提供）で収益を得る。

- **無料**: ローカル保存。ユーザーが自分でデータを管理
- **有料**: マネージドストレージ。バックアップ、TSA タイムスタンプ、長期保存、同期を提供
- オープンソースのクライアント + 有料ストレージサービスのモデル（GitLab/Obsidian Sync 方式）

### Typst を選ぶ理由

| 利点                  | 詳細                                          |
|----------------------|-----------------------------------------------|
| Rust ネイティブ        | `typst` crate で GPUI アプリに埋め込み可能      |
| 高速コンパイル         | comemo による自動メモ化でリアルタイムプレビュー    |
| 科学文書に強い         | 数式・表・図・参照が標準で充実                   |
| PDF/A 出力            | アーカイブ・提出用の高品質 PDF をネイティブ生成    |
| スクリプト可能         | `#let`, `#for`, `csv()`, `json()` でデータ処理  |
| パッケージ             | cetz（グラフ描画）, physica, unify 等           |

### アーキテクチャ方針（決定済み）

```
GPUI エディタ（Typst ソース直接編集 + プレビュー）
       |
  Typst ソース（.typ ファイル）  ← ユーザーが直接編集
       |                          ← フォーム補助入力で Typst コードを挿入
       |  typst crate
  リアルタイムプレビュー / PDF エクスポート
       |
  ストレージ（ローカル or マネージドサービス）
```

- ユーザーは Typst を直接書いて編集する。これが主要な編集手段。
- 必要に応じて GUI フォーム入力も使える（補助的な入力手段）。
- Typst はレンダリング/エクスポートエンジンであると同時に、編集フォーマットでもある。

### コラボレーション方針（決定済み）

リアルタイム共同編集は不要。実験ノートは本質的に個人の記録であり、
ALCOA+ の「Attributable（帰属可能）」の観点からも記録者は1人であるべき。

Automerge（CRDT）は優先度を大幅に下げ、現時点では採用しない。

**実際に必要な「共同」の形:**

| 形態              | 必要な機能                          | リアルタイム編集 |
|------------------|-------------------------------------|--------------|
| PI レビュー・承認   | 閲覧 + 電子署名                      | 不要         |
| プロトコル共有      | テンプレートの共有リポジトリ            | 不要         |
| データ参照         | 他メンバーのノートへのリンク/参照        | 不要         |
| 引き継ぎ           | 退職者のノートの読み取りアクセス         | 不要         |
| 共同研究           | .eln 形式でのデータ交換                | 不要         |

→ マネージドストレージで「チーム共有・閲覧・署名」を提供する。

### ストレージ方針（決定済み: redb + ハッシュチェーン）

Git は不採用。理由:
- 研究者に git の知識を要求できない（エッジケースで必ず破綻する）
- 数 GB の実験データで .git が肥大化し、clone/gc が実用的でない
- git は「テキストの変更履歴」に最適化されており、大容量バイナリには不向き

redb + ハッシュチェーン + blob 分離方式を採用:
- テキスト（Typst ソース）: redb にリビジョン保存（軽量）
- バイナリ（画像・計測データ）: ファイルシステム + サーバー保管（遅延ダウンロード）
- ローカルに必要な容量は数十 MB。数 GB のデータはサーバーに保管

詳細は `architecture-v3.md` を参照。

---

## 2. ELN 規制要件（アカデミアレベル）

### ALCOA+ 原則（データインテグリティの国際基準）

| 原則              | 意味                    | 実装アプローチ                     |
|------------------|-------------------------|-----------------------------------|
| Attributable     | 記録者に追跡可能          | ユーザー認証 + 操作ログ             |
| Legible          | 判読可能・永続的          | Typst → PDF                       |
| Contemporaneous  | リアルタイムで記録        | 自動保存 + 自動タイムスタンプ        |
| Original         | 最初の記録を保持          | 不変の履歴                         |
| Accurate         | 正確で誤りがない          | ブロックスキーマでのバリデーション    |
| +Complete        | 修正含む全データ保持       | 完全な変更履歴                     |
| +Consistent      | 時系列順・定義フォーマット  | 構造化データ                       |
| +Enduring        | 耐久的な形式で保存        | 非プロプライエタリ形式              |
| +Available       | レビュー・監査時にアクセス可能 | 検索 + エクスポート              |

### 日本固有の要件

- **PMDA**: 非臨床安全性試験の GLP 準拠
- **認定タイムスタンプ**: 総務大臣認定 TSA（時刻認証局）
- **科研費（2024年度〜）**: 全採択課題でデータマネジメントプラン（DMP）作成が義務化

### 必要機能（アカデミア）

```
必須:
  - 改ざん防止の監査証跡（誰が/何を/いつ）
  - 電子署名（実験者 + PI 承認）
  - 署名後のレコードロック（読み取り専用化）
  - 信頼できるタイムスタンプ（TSA 連携）
  - 非プロプライエタリ形式でのエクスポート（PDF, .eln）
  - バックアップと長期保存（5年以上）

推奨:
  - 実験プロトコルのテンプレートシステム
  - 全文検索
  - ファイル添付（画像、CSV）
  - オフライン動作
  - .eln 形式エクスポート（ELN Consortium 標準、RO-Crate ベース）

あると良い:
  - @メンションによるエントリ間クロスリファレンス
  - カンバンビュー（実験の状態管理）
  - 機器メタデータのリンク
```

---

## 3. 競合分析まとめ

### オープンソース ELN

| 製品      | 技術スタック              | エディタ         | 強み                                     | 弱み                      |
|-----------|-------------------------|-----------------|------------------------------------------|--------------------------|
| eLabFTW   | PHP/MySQL/TinyMCE       | TinyMCE (HTML)  | RFC 3161 TSA、minisign 署名、.eln エクスポート | 古い UI、LIKE ベース検索    |
| RSpace    | Java/Spring/PostgreSQL  | リッチテキスト    | 50以上の外部連携、OSS 化（2024年）            | エンタープライズ機能が限定的  |

### 有償 ELN

| 製品               | 技術スタック（推定含む）     | エディタ            | 価格                   | 主な差別化要因              |
|--------------------|---------------------------|--------------------|-----------------------|---------------------------|
| Benchling          | Python/Flask + React + PG | ProseMirror（推定） | 無料（学術）〜$2400/席  | 生命科学ツール（配列エディタ）|
| LabArchives        | Java + TinyMCE            | TinyMCE（バグ多）   | $330/席（学術）         | 大学一括ライセンス          |
| Signals Notebook   | Java/Spring + React       | ブロック型（モダン）  | エンタープライズ価格     | ChemDraw 統合              |
| IDBS E-WorkBook    | Java/Oracle               | スプレッドシート中心  | エンタープライズ価格     | BPMN ワークフローエンジン    |
| SciNote            | Web アプリ                 | ステップ型          | $250/席               | 在庫管理統合               |
| Labguru            | Ruby on Rails             | リッチテキスト       | 要問い合わせ            | カンバン/マイルストーン統合   |
| Labfolder          | Web アプリ                 | Data Elements      | 要問い合わせ            | 構造化フォームフィールド      |

### 研究者が使う非 ELN ツール

| ツール     | Love Note との関連性                                        |
|-----------|-------------------------------------------------------------|
| Jupyter   | セルモデル ≈ ブロックモデル。MIME タイプ出力。                   |
| Obsidian  | YAML frontmatter、Dataview クエリ、git プラグイン自動コミット  |
| Notion    | ブロックツリーモデル、スラッシュコマンド、プロパティ型            |
| AFFiNE    | BlockSuite（CRDT + ブロック）、ローカルファースト、OSS           |
| AppFlowy  | Rust コア + Yrs CRDT、Rust でのブロックモデル実装               |
| Craft     | ネイティブ（Swift）ブロックエディタ、Web 技術不使用 — GPUI に最も近い |

---

## 4. 転用可能なパターン一覧

### 4.1 データモデル

| 転用元      | パターン                                             | Love Note での適用                          |
|------------|-----------------------------------------------------|-------------------------------------------|
| eLabFTW    | experiments テーブル: elabid, body, metadata(JSON), locked, timestamped | redb ドキュメントスキーマ         |
| eLabFTW    | Changelog + Revisions の二層追跡                      | redb に軽量 changelog                      |
| Notion     | フラット HashMap ブロック + parent/children 参照        | BTreeMap<BlockId, Block> モデル            |
| Obsidian   | YAML frontmatter でメタデータ構造化                    | Typst frontmatter → redb インデックス自動抽出 |
| Benchling  | days[] 構造（日付ごとのセクション）                      | 日付単位 .typ ファイル自動分割               |
| Kadi4Mat   | Record + Collection + リンクグラフ                     | ドキュメント間リンクを redb で管理            |

### 4.2 監査証跡 / タイムスタンプ

| 転用元                | パターン                                                            | Love Note での適用                    |
|----------------------|---------------------------------------------------------------------|---------------------------------------|
| eLabFTW              | RFC 3161 TSA: データ → openssl ts-query → POST → 検証 → アーカイブ ZIP | reqwest crate で同フローを再利用       |
| eLabFTW              | 複数 TSA プロバイダ対応（DFN, DigiCert 等）                            | 設定ファイルで TSA URL を指定           |
| GitTrustedTimestamps | post-commit フックでタイムスタンプをコミットにチェーン追加                  | Git 採用時はそのまま再利用             |
| Benchling            | イベントソーシング + PG トリガー、追記専用監査テーブル                     | Git コミットが自然なイベントログになる    |

### 4.3 署名 / ロック

| 転用元      | パターン                                                     | Love Note での適用                              |
|------------|-------------------------------------------------------------|------------------------------------------------|
| eLabFTW    | minisign（Ed25519ph）+ 署名アーカイブ ZIP                      | 署名アーカイブ形式を採用。第三者検証可能            |
| eLabFTW    | 署名の意味の Enum: Approval, Review, Authorship               | PI 承認 vs 実験者の記録を区別                     |
| LabArchives| ページ署名 + 証人署名（Witnessing）→ ロック                     | 2段階: 実験者署名 → PI カウンターサイン            |
| Benchling  | 署名時にコンテンツの SHA-256 ハッシュを保存                      | 署名時にドキュメント内容をハッシュ化                |

### 4.4 テンプレート

| 転用元     | パターン                                        | Love Note での適用                                |
|-----------|------------------------------------------------|--------------------------------------------------|
| eLabFTW   | テンプレートと実験が同一スキーマ                    | templates/ ディレクトリに .typ ファイルを配置        |
| Benchling | Sub-template（再利用可能なブロック部品）            | Typst の #import で共有コンポーネント               |
| SciNote   | プロトコルバージョン追跡                           | frontmatter に template_version を記録             |
| Labfolder | Data Elements（ノート内のフォームフィールド）       | field_schema() → GUI フォーム自動生成              |
| Typst     | ネイティブスクリプト（#let, #for, csv()）          | テンプレートがデータを自動処理                      |

### 4.5 エクスポート / 相互運用

| 転用元    | パターン                                          | Love Note での適用                         |
|----------|--------------------------------------------------|-------------------------------------------|
| eLabFTW  | .eln（RO-Crate）: ZIP + JSON-LD メタデータ          | zip + serde_json crate で実装              |
| RSpace   | オフラインブラウザブルな HTML エクスポート             | Typst SVG 出力 → 自己完結型 HTML            |
| Typst    | ネイティブ PDF/A 出力                               | HTML→PDF 変換より圧倒的に高品質              |
| mdBook   | SUMMARY.md でドキュメント構造を定義                  | SUMMARY.typ でノートブック構造を定義          |

### 4.6 検索

| 転用元           | パターン                                    | Love Note での適用                        |
|-----------------|---------------------------------------------|------------------------------------------|
| Benchling       | PostgreSQL → Celery → Elasticsearch         | redb インデックス + tantivy（Rust 全文検索）  |
| eLabFTW         | AST クエリパーサー（Visitor パターン）           | フィールド指定検索（date:, author:）         |
| Obsidian Dataview| frontmatter をクエリ可能なデータベースとして扱う | frontmatter → redb 構造化検索              |

### 4.7 エディタ / UX

| 転用元    | パターン                                            | Love Note での適用                           |
|----------|----------------------------------------------------|--------------------------------------------|
| Craft    | Web 技術なしのネイティブブロックエディタ                 | GPUI ブロックエディタ（最も近い参考実装）       |
| AppFlowy | Rust でのブロックモデル + Yrs CRDT                    | Rust でのブロックモデル設計の参考               |
| Notion   | スラッシュコマンドでブロック挿入                        | "/" → ブロックタイプパレット                   |
| Notion   | 仮想スクロール + ブロック遅延読み込み                   | GPUI の list/uniform_list                    |
| AFFiNE   | BlockSuite: ブロックツリーを CRDT の YMap/YArray で管理 | ブロックツリー設計の参考（CRDT は不採用）        |
| Benchling| 自動計算付き構造化テーブル                             | Typst スクリプトで自動計算                     |

---

## 5. プラグイン / 拡張 API 設計

### 現状

```rust
// 現状: テキストのみ、構造化データ非対応
pub trait BlockContent: 'static {
    fn type_name(&self) -> &'static str;
    fn placeholder(&self) -> &'static str;
    fn render_view(&self, text: &str) -> AnyElement;
    fn render_edit(&self, input: &Entity<InputState>) -> AnyElement;
}
```

### 提案: BlockContent v2

```rust
pub trait BlockContent: 'static {
    fn type_name(&self) -> &'static str;
    fn icon(&self) -> &'static str;
    fn category(&self) -> BlockCategory;

    /// フィールド定義（GUI フォーム自動生成用）
    fn field_schema(&self) -> Vec<FieldDef>;

    /// 表示モードでのレンダリング
    fn render_view(&self, data: &BlockData, cx: &App) -> AnyElement;

    /// 編集モードでのレンダリング（GUI フォーム）
    fn render_edit(&self, data: &BlockData, cx: &mut Context) -> AnyElement;

    /// 構造化データから Typst マークアップを生成
    fn to_typst(&self, data: &BlockData) -> String;

    /// 新規ブロックのデフォルトデータ
    fn default_data(&self) -> BlockData;
}

pub struct BlockData {
    pub text: String,
    pub fields: serde_json::Value,
}

pub enum FieldType {
    Text,
    Number { unit: Option<String> },
    Date,
    Select { options: Vec<String> },
    MultiSelect { options: Vec<String> },
    File { accept: Vec<String> },
    Table { columns: Vec<ColumnDef> },
    Chemical { format: ChemFormat },
}

pub enum BlockCategory {
    Basic,      // テキスト、見出し、リスト
    Data,       // テーブル、グラフ、CSV
    Science,    // 化学、生物、数学
    Media,      // 画像、ファイル、埋め込み
    Metadata,   // 日付、著者、機器
}
```

### 核心設計: Typst 直接編集 + フォーム補助入力

```
通常の編集フロー:
  Typst ソースを直接編集 → リアルタイムプレビュー → PDF 出力

フォーム補助入力（構造化データ向け）:
  スラッシュコマンド "/" → ブロック選択（例: 試薬テーブル）
       ↓
  GUI フォーム表示: [量: ______ mg]
       ↓
  to_typst() が Typst マークアップを生成
       ↓
  エディタのカーソル位置に Typst コードを挿入
       ↓
  以降は Typst ソースとして直接編集可能
```

### Typst 直接編集が主、フォーム入力は補助

- **主要操作**: Typst ソースを直接編集 + リアルタイムプレビュー
- **補助操作**: 構造化データ（試薬テーブル等）は GUI フォームからも入力可能
- フォームで入力したデータは Typst ソースに変換されて挿入される（一方向）
- 上級者もそうでない人も同じエディタを使う。Typst の学習曲線は LaTeX より遥かに低い

### データ入力の UX パターン

| パターン            | 説明                                                  | 参考元              |
|--------------------|------------------------------------------------------|---------------------|
| Typst 直接編集      | メインの編集手段。シンタックスハイライト + リアルタイムプレビュー | Typst app, Zed      |
| スラッシュコマンド    | "/" → スニペット/テンプレート挿入パレット                  | Notion, Benchling   |
| フォーム補助入力     | 構造化データ（テーブル等）を GUI で入力 → Typst コード挿入   | Labfolder           |
| CSV ドラッグ&ドロップ | CSV ドロップ → 列マッピング UI → Typst テーブル/グラフ挿入  | 独自               |
| テンプレート        | テンプレート選択 → パラメータ入力 → .typ ファイル生成        | Benchling, SciNote  |

### BlockRegistry（動的ブロック登録）

```rust
pub struct BlockRegistry {
    blocks: HashMap<String, Box<dyn Fn() -> Box<dyn BlockContent>>>,
}

// 組み込みブロック
registry.register("text", || Box::new(TextBlock));
registry.register("heading", || Box::new(HeadingBlock));

// 科学系ブロック（組み込み、分野特化）
registry.register("reagent_table", || Box::new(ReagentTableBlock));
registry.register("protocol_step", || Box::new(ProtocolStepBlock));
registry.register("pcr_cycle", || Box::new(PcrCycleBlock));

// 将来: WASM プラグインでサードパーティブロックを動的追加
```

---

## 6. 既存 ELN に対する差別化

| 既存 ELN のユーザー痛点           | Love Note の優位性                          |
|--------------------------------|--------------------------------------------|
| ベンダーロックイン               | Git + Typst = 完全オープンフォーマット         |
| 高価格（$330〜2400/席/年）       | 無料で使える + 有料ストレージサービス            |
| バグの多い古い UI（LabArchives）  | GPU 加速ネイティブ UI（GPUI）                |
| オフライン非対応                  | ローカルファーストアーキテクチャ               |
| 大規模データでのパフォーマンス低下  | Rust + GPUI のネイティブ性能                 |
| 複雑な UI / 急な学習曲線          | Typst のシンプルさ + ミニマル UI              |
| PDF エクスポート品質が低い        | Typst = 最高品質の PDF 出力                  |
| 自動ログアウト問題               | ローカルアプリなのでセッション切れなし          |
| 検索が弱い                      | tantivy（Rust 全文検索エンジン）              |

---

## 7. 未解決の課題

1. ~~**Git vs redb+ハッシュチェーン**~~ → **redb + ハッシュチェーンに決定**（git は研究者に不適、大容量データで破綻）
2. ~~**Automerge の役割**~~ → **不採用**（リアルタイム共同編集の需要なし。共有・閲覧・署名はストレージサービスで提供）
3. ~~**WASM プラグイン vs ネイティブプラグイン**~~ → **Rhai スクリプトに決定**（組み込みブロックは Rust crate、拡張は Rhai。WASM はオーバースペック）
4. **Typst World 実装** — エディタ内で Typst をどうレンダリングするか
5. ~~**署名の UX**~~ → **決定**（無料版: パスフレーズ入力、有料版: アカウント認証。PI は無料版で .eln 経由、有料版で Web ダッシュボード）
6. **TSA プロバイダ** — どの日本の認定 TSA を使うか？
7. **ELN ファイルフォーマット** — .eln（RO-Crate）対応の優先度
8. **マネージドストレージ設計** — チーム共有・PI閲覧・署名フローの技術設計

---

## 8. 提案フェーズ

### Phase 1: コア ELN（MVP）

- [ ] BlockContent v2（field_schema() + to_typst()）
- [ ] BlockRegistry（動的ブロックタイプ登録）
- [ ] Typst World 実装（GPUI でのプレビューレンダリング）
- [ ] テンプレートシステム（templates/ ディレクトリ、#import）
- [ ] スラッシュコマンドによるブロック挿入
- [ ] 自動保存（デバウンス付き）
- [ ] 基本組み込みブロック: テキスト、見出し、テーブル、プロトコルステップ

### Phase 2: 信頼性 & コンプライアンス

- [ ] ストレージバックエンドの決定（git vs カスタム）
- [ ] 電子署名（Ed25519 or git -S）
- [ ] RFC 3161 タイムスタンプ連携
- [ ] 署名後のレコードロック
- [ ] 変更ログ / 監査証跡
- [ ] PDF/A エクスポート

### Phase 3: エコシステム

- [ ] .eln（RO-Crate）エクスポート/インポート
- [ ] 全文検索（tantivy）
- [ ] 科学系ブロック: 試薬テーブル、PCR サイクル 等
- [ ] CSV インポート（列マッピング付き）
- [ ] @メンション クロスリファレンス
- [ ] 大容量ファイル対応（git-annex or カスタム）

### Phase 4: チーム共有（マネージドストレージ機能）

- [ ] ストレージサービスでのノート閲覧権限共有
- [ ] PI 承認フロー（リモート署名）
- [ ] テンプレート/プロトコルの共有リポジトリ
- [ ] チームダッシュボード（メンバーの実験一覧）

※ リアルタイム共同編集（Automerge 等）は需要が確認されない限り実装しない

---

## 参考文献

### 規制関連
- FDA 21 CFR Part 11
- ALCOA+（FDA/EMA/WHO データインテグリティ基準）
- 日本 GLP（PMDA）
- 総務大臣認定タイムスタンプ制度
- 科研費 DMP 義務化（2024年度〜）

### 技術関連
- [eLabFTW](https://github.com/elabftw/elabftw) — AGPL, PHP, 最も包括的な OSS ELN
- [RSpace](https://github.com/rspace-os) — OSS 化（2024年）, Java/Spring
- [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) — Rust + Yrs CRDT
- [AFFiNE BlockSuite](https://github.com/toeverything/blocksuite) — ブロック + CRDT フレームワーク
- [GitTrustedTimestamps](https://github.com/mabuware/GitTrustedTimestamps) — RFC 3161 + git
- [ELN File Format](https://github.com/TheELNConsortium/TheELNFileFormat) — RO-Crate 仕様
- [Typst](https://github.com/typst/typst) — Rust 組版システム
- [tantivy](https://github.com/quickwit-oss/tantivy) — Rust 全文検索エンジン
- [git2](https://github.com/rust-lang/git2-rs) — libgit2 Rust バインディング
