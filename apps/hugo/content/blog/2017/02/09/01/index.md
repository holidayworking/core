---
date: 2017-02-09 08:00:00 +0900
title: Mackerel の AWS WAF プラグインを作った
tags:
  - mackerel
---

Mackerel 上で AWS WAF のメトリックスを確認したかったのでプラグインを作った。

{{< hatenablog-parts url="https://github.com/holidayworking/mackerel-plugin-aws-waf" >}}

## 使い方

[リースページ](https://github.com/holidayworking/mackerel-plugin-aws-waf/releases) からパッケージをダウンロードして、適切な場所に配置する。

そして、Mackerel エージェントの設定ファイルに下記を追加する。

```text
[plugin.metrics.aws-waf]
command = "/path/to/mackerel-plugin-aws-waf -web-acl=<aws-waf-web-acl> [-region=<aws-region>]"
```

`web-acl` オプションにはメトリックスを取得したい AWS WAF の Web ACL 名を設定する。

`region` オプションには適切なリージョンを設定する。AWS WAF を CloudFront と連携している場合は `us-east-1` を、ALB と連携している場合はそのリージョンを設定する。

## 今後やりたいこと

AWS WAF はルールを複数設定できるが、現状メトリックスを取得するルールは ALL 固定となっている。これだと SQL インジェクションやクロスサイトスクリプトのルールのブロックしたリクエスト数を Mackerel 上で確認できない。そのため、メトリックスを取得するルールを複数設定できるようにしたい。
