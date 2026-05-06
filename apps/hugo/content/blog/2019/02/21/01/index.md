---
date: 2019-02-21 20:00:34 +0900
title: mackerel-plugin-elasticsearch-cluster-stats をつくった
tags:
  - mackerel
images:
  - blog/2019/02/21/01/20190221195838.png
---

Mackerel アンバサダーに就任したので mackerel-plugin-elasticsearch-cluster-stats をつくった。

{{< hatenablog-parts url="https://github.com/holidayworking/mackerel-plugin-elasticsearch-cluster-stats" >}}

## 背景

Mackerel の AWS インテグレーションで Amazon Elasticsearch Service を監視しているけど、対応しているメトリックでは fielddata や Query Cache がどれぐらいメモリーを確認することが出来ない状態である。CloudWatch でこれらのメトリックが取得できるようになればよいのだけど…。

[mackerel-plugin-elasticsearch](https://github.com/mackerelio/mackerel-agent-plugins/tree/master/mackerel-plugin-elasticsearch) を使う方法も考えたけど、このプラグインは Amazon Elasticsearch Service が対応していない [Node Stats](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-nodes-stats.html) でメトリックを取得しているため、このプラグインを使うことを断念した。

Node Stats と同様のメトリックが取得できそうである [Cluster Stats](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-stats.html) は Amazon Elasticsearch Service で対応しているので、Cluster Stats から必要なメトリックを取得するプラグインを作成することにした。

## 使い方

mkr plugin install でインストールできるようになっているので、このプラグインを実行するサーバーで次のコマンドを実行する。

```bash
$ mkr plugin install mackerel-plugin-elasticsearch-cluster-stats
```

Mackerel エージェントの設定ファイルに下記を追加する。

```text
[plugin.metrics.elasticsearch-cluster-stats]
command = "/opt/mackerel-agent/plugins/bin/mackerel-plugin-elasticsearch-cluster-stats [-scheme=<'http'|'https'>] [-host=<host>] [-port=<port>] [-metric-key-prefix=<prefix>] [-tempfile=<tempfile>]"
```

Mackerel エージェントを再起動して、しばらくすると次のような感じでグラフが作成されるはずである。

{{< screenshot src="20190221195838.png" >}}
