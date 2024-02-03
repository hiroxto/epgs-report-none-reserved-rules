# epgs-report-none-reserved-rules

EPGStation の 1 件も予約がない予約ルールをSlackに通知するスクリプト。
有効なルールかつ，予約が 0 件のルールを抽出し，Slackに投稿する。

## 設定

依存関係をインストール。
Bun を使用する。

```bash
bun install
```

.env.example ファイルを参考に .env ファイルを作成する。

## 実行方法

Bun を使って実行する。

```bash
bun run main.ts
```
