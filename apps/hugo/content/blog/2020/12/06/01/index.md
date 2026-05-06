---
date: 2020-12-06 08:02:44 +0900
title: Mackerel のカスタムメトリックプラグインをサービスメトリックに連携
tags:
  - mackerel
images:
  - blog/2020/12/06/01/20201202204058.png
---

この記事は [Mackerel Advent Calendar 2020](https://qiita.com/advent-calendar/2020/mackerel) の 6 日目の記事である。

Mackerel ではカスタムメトリックプラグインを利用することで自分たちに必要なミドルウェアのメトリックを収集できることだと考えている。Mackerel エージェントをインストールした状態では[システムメトリック](https://mackerel.io/ja/docs/entry/spec/metrics)のみの取集となるため、必要なミドルウェアのメトリックを取集するためには、カスタムメトリックプラグインを利用することになる。カスタムメトリックは下記から探すことができるはず。

- [公式プラグイン集](https://github.com/mackerelio/mackerel-agent-plugins)
- [公式プラグインレジストリ](https://github.com/mackerelio/plugin-registry)
  - 登録されているプラグインは少ないかも…
- GitHub で検索

有益なカスタムメトリックプラグインがいろいろとあるが、ホストに紐づくカスタムメトリックではなく、サービスに紐づくサービスメトリックへ連携したいことがたまにある。どのような方法があるのかを考えていたときに、Mackerel の CRE である @a-know さんが mackerel-remora を使うことを思いついた。

{{< hatenablog-parts url="https://github.com/a-know/mackerel-remora" >}}

{{< hatenablog-parts url="https://blog.a-know.me/entry/2019/04/07/214407" >}}

mackerel-remora ではカスタムメトリックプラグインの出力形式でサービスメトリックに連携してくれる素晴らしいツールである。

今回は mackerel-plugin-nature-remo をサービスメトリックに連携してみることにした。

## 連携方法

mackerel-remora では Docker イメージが公開されているので、Docker Compose で起動することにした。

適当なディレクトリに設定ファイルとプラウグインを次のように配置する。

```text
├── config.yml
├── docker-compose.yml
└── plugins
    └── mackerel-plugin-nature-remo_linux_amd64
        ├── README.md
        └── mackerel-plugin-nature-remo
```

`config.yml` は次のような内容である。

```yaml
apikey: { { Mackerel の API キー } }
plugin:
  servicemetrics:
    home:
      nature-remo:
        command: /app/plugins/mackerel-plugin-nature-remo_linux_amd64/mackerel-plugin-nature-remo -access-token {{ Nature Remo のアクセストークン }}
```

また、`docker-compose.yml` は次のような内容である。

```yaml
version: "3"
services:
  remora:
    image: aknow/mackerel-remora:latest
    restart: always
    volumes:
      - .:/app
    environment:
      MACKEREL_REMORA_CONFIG: /app/config.yml
```

そして、Docker コンテナーを起動する。

```bash
$ docker-compose up -d
```

しばらくすると、サービスメトリックに Nature Remo が収集した温度や湿度が連携されるようになる。

{{< screenshot src="20201202204058.png" >}}

## まとめ

Mackerel のカスタムメトリックプラグインをサービスメトリックへ連携するために mackerel-remora を使ってみた。今回は Docker Compose でホストディレクトリをマウントして、設定ファイルとプラグインを読み込んだが、Docker イメージ内にそれらを含めることで AWS Fargate などでも動かすことができるはずである。
