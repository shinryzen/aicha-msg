#!/bin/bash
# AiCHA 2.0 自動ビルド・デプロイ用スクリプト

echo "🚀 AiCHA 2.0 のビルドを開始します..."

# 1. 依存関係のインストール
npm install

# 2. ビルドの実行 (dist フォルダの生成)
echo "📦 プレビュー用ファイルをビルド中..."
npm run build

# 3. Firebase へのデプロイ
if [ -f "./firebase.json" ]; then
  echo "雲の上の Firebase Hosting にアップロード中..."
  firebase deploy --only hosting
  echo "✅ デプロイが完了しました！"
  echo "公開URL: https://aicha-msg.web.app"
else
  echo "❌ Error: firebase.json が見つかりませんでした。"
fi
