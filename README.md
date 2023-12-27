# epgs-report-none-reserved-rules

EPGStation の 1 件も予約がない予約ルールをSlackに通知するスクリプト。
有効なルールかつ，予約が 0 件のルールを抽出し，Slackに投稿する。

## 設定

.env.example ファイルを参考に .env ファイルを作成する。

## 実行方法

Deno を使って実行する。
.env ファイルの読み込みと，Slack API の実行を行うため，実行時のオプションに --allow-read と --allow-net を付与する。

```bash
$ deno run --allow-read --allow-net epgs-report-none-reserved-rules.ts
```
