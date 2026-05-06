---
date: 2017-02-22 08:00:00 +0900
title: mackerel-plugin-aws-waf v0.0.2 をリリースした
tags:
  - mackerel
---

指定された WebACL に関連づけられている全ルールのメトリックスを取得するようにした mackerel-plugin-aws-waf の最新バージョンをリリースした。

{{< hatenablog-parts url="https://github.com/holidayworking/mackerel-plugin-aws-waf/releases/tag/v0.0.2" >}}

## 修正点

WebACL に関連づけられている全ルールのメトリックスを取得するために、次の修正を実施した。

- WebACL の指定方法を WebACL 名から WebACL ID に変更
  - [GetWwbACL](http://docs.aws.amazon.com/ja_jp/waf/latest/APIReference/API_GetWebACL.html) で Web ACL ID を指定する必要があるため
- グラフ定義における名前を `custom.waf.Requests` から `custom.waf.Requests.#.*` に変更
- ALB と連携している AWS WAF のサポートを削除
  - AWS WAF の API には AWS WAF と AWS WAF Regional の 2 種類がある
    - AWS WAF : CloudFront
    - AWS WAF Regional : ALB
  - API をどのように使い分けるか迷ったので AWS WAF Regional の実装をしないことに
