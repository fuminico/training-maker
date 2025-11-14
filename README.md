# Training Maker - 研修動画自動生成ツール

PowerPointファイルから研修動画を自動生成するWebアプリケーション

## 概要

Training Makerは、PowerPointプレゼンテーションを研修動画に変換する自動化ツールです。
以下の機能を提供します：

- PPTXファイルのアップロードと解析
- スライドからのテキスト抽出
- ナレーション原稿の自動生成と編集
- TTS（Text-to-Speech）による音声生成
- スライド画像と音声の合成による動画生成

## 技術スタック

### フロントエンド & API
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **TanStack Query** (React Query)
- **Vercel** (デプロイ)

### バックエンド
- **Supabase**
  - PostgreSQL (データベース)
  - Auth (認証)
  - Storage (ファイルストレージ)

### メディア処理
- **Node.js ワーカー** (別プロセス)
  - PPTX解析
  - ffmpeg による動画合成

## プロジェクト構造

```
training-maker/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── me/             # ユーザープロフィール
│   │   └── projects/       # プロジェクト管理
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # React コンポーネント
├── lib/                    # ユーティリティ・ヘルパー
│   ├── api/                # API ユーティリティ
│   ├── supabase/           # Supabase クライアント
│   ├── tts/                # TTS抽象化レイヤー
│   └── types/              # TypeScript 型定義
├── supabase/
│   └── migrations/         # DB マイグレーション
├── worker/                 # メディア処理ワーカー
│   └── src/
│       ├── jobs/           # ジョブハンドラー
│       └── services/       # PPTX, ffmpeg など
├── CLAUDE.md               # 詳細設計書
└── README.md
```

## セットアップ

### 前提条件

- Node.js 20以上
- npm または yarn
- Supabase アカウント

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd training-maker
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、必要な値を設定します：

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# TTS Provider
TTS_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key

# Worker
WORKER_ENDPOINT=http://localhost:3001
WORKER_SECRET_KEY=your-worker-secret-key
```

### 4. Supabase データベースのセットアップ

Supabase ダッシュボードで SQL エディタを開き、以下のマイグレーションファイルを実行：

```bash
supabase/migrations/001_initial_schema.sql
```

または、Supabase CLI を使用：

```bash
supabase db push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## データベーススキーマ

詳細なデータベース設計は `CLAUDE.md` を参照してください。

### 主要テーブル

- `profiles` - ユーザープロフィール
- `projects` - 研修プロジェクト
- `project_settings` - プロジェクトごとの設定
- `slides` - スライド情報
- `jobs` - 非同期処理ジョブ
- `media_files` - メディアファイル管理

## API エンドポイント

### 認証・プロフィール

- `GET /api/me` - ログインユーザーのプロフィール取得

### プロジェクト

- `GET /api/projects` - プロジェクト一覧
- `POST /api/projects` - 新規プロジェクト作成
- `GET /api/projects/:projectId` - プロジェクト詳細
- `PATCH /api/projects/:projectId` - プロジェクト更新
- `POST /api/projects/:projectId/pptx/upload-url` - PPTXアップロード用署名付きURL生成
- `POST /api/projects/:projectId/parse` - PPTX解析ジョブ起動

### スライド

- `GET /api/projects/:projectId/slides` - スライド一覧
- `GET /api/projects/:projectId/slides/:slideId` - スライド詳細
- `PATCH /api/projects/:projectId/slides/:slideId` - スライド更新
- `POST /api/projects/:projectId/slides/recalc-time` - 推定時間再計算

### 音声設定・生成

- `GET /api/projects/:projectId/audio-settings` - 音声設定取得
- `PATCH /api/projects/:projectId/audio-settings` - 音声設定更新
- `POST /api/projects/:projectId/audio/generate` - 音声生成ジョブ起動

### 動画生成

- `POST /api/projects/:projectId/video/generate` - 動画生成ジョブ起動
- `GET /api/projects/:projectId/video` - 動画情報取得
- `GET /api/projects/:projectId/video/download-url` - 動画ダウンロード用URL取得

### ジョブ管理

- `GET /api/projects/:projectId/jobs` - プロジェクトのジョブ一覧
- `GET /api/jobs/:jobId` - ジョブ詳細

### 管理者用

- `GET /api/admin/dashboard` - ダッシュボードサマリ
- `GET /api/admin/users` - ユーザー一覧
- `PATCH /api/admin/users/:userId` - ユーザー更新
- `GET /api/admin/logs` - ログ一覧

## 開発ロードマップ

### Phase 1: プロジェクト基盤 ✅
- [x] Next.js + TypeScript プロジェクトのセットアップ
- [x] Supabase の設定とデータベーススキーマの作成
- [x] 基本的な認証フロー
- [x] プロジェクト管理APIの実装

### Phase 2: PPTX処理とスライド管理 ✅
- [x] PPTX アップロード機能
- [x] メディア処理ワーカーの基本実装
- [x] PPTX 解析処理
- [x] スライド一覧表示と原稿編集機能

### Phase 3: TTS統合と音声生成 ✅
- [x] TTS プロバイダの抽象化レイヤー
- [x] 音声生成ジョブの実装
- [x] プロジェクト/スライド単位の音声設定管理
- [x] 音声API統合

### Phase 4: 動画生成 ✅
- [x] ffmpeg を使った動画合成処理
- [x] 動画生成ジョブの実装
- [x] 動画ダウンロード機能
- [x] 進捗表示の実装

### Phase 5: 管理機能と最適化 ✅
- [x] 管理者ダッシュボード
- [x] ユーザー管理機能
- [x] ログ・監視機能
- [x] 基本UIコンポーネント

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずイシューを開いて変更内容を議論してください。
