# epgs-report-none-reserved-rules

EPGStation の 1 件も予約がない予約ルールをSlackに通知するスクリプト。
有効なルールかつ，予約が 0 件のルールを抽出し，Slackに投稿する。

## 設定

[mise](https://mise.jdx.dev/) を使い、`mise.toml` で指定した Bun をインストールする。

```bash
mise trust
mise install
```

`mise run setup` を実行し、.env ファイルのコピーと依存関係のインストールを行う。

```bash
mise run setup
```

.env ファイルの各項目を、利用する環境に合わせて書き換える。

## 実行方法

mise のタスクを使って実行する。

```bash
mise run start
```
