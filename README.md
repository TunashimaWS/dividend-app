# 配当金管理アプリ

夫婦の資産管理Webアプリ。

## セットアップ手順

### 1. Firebaseプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication → ログイン方法 → メール/パスワード を有効化
3. Firestore Database を作成（本番モード）
4. プロジェクト設定 → Webアプリを追加 → 設定値をコピー

### 2. Firestoreセキュリティルールを設定

Firestore Console の「ルール」タブに `firestore.rules` の内容を貼り付けて公開。

### 3. GitHubにリポジトリをプッシュ

```bash
git remote add origin https://github.com/[ユーザー名]/dividend-app.git
git branch -M main
git push -u origin main
```

### 4. GitHub Secretsを設定

リポジトリ → Settings → Secrets and variables → Actions → New repository secret

| Secret名 | 値 |
|---------|---|
| VITE_FIREBASE_API_KEY | Firebase APIキー |
| VITE_FIREBASE_AUTH_DOMAIN | xxx.firebaseapp.com |
| VITE_FIREBASE_PROJECT_ID | プロジェクトID |
| VITE_FIREBASE_STORAGE_BUCKET | xxx.appspot.com |
| VITE_FIREBASE_MESSAGING_SENDER_ID | 送信者ID |
| VITE_FIREBASE_APP_ID | アプリID |

### 5. GitHub Pagesを有効化

リポジトリ → Settings → Pages → Source: **GitHub Actions**

### 6. アクセス

`https://[ユーザー名].github.io/dividend-app/` でアクセスできます。

### 7. Firebaseでユーザーを作成

Firebase Console → Authentication → ユーザーを追加 → メールとパスワードを設定

（ご自身と奥様の2アカウント分）

## 開発

```bash
npm install
cp .env.example .env  # Firebase設定値を入力
npm run dev
```
