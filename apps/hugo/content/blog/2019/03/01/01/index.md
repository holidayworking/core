---
date: 2019-03-01 22:39:42 +0900
title: Mackerel のロール内異常検知に対する所感
tags:
  - mackerel
---

Mackerel のロール内異常検知がやっとリリースされた。

{{< hatenablog-parts url="https://mackerel.io/ja/blog/entry/anomaly-detection-for-roles/about" >}}

早速設定してみたが、この機能は難しいと感じた。これまでの監視ルールでは CPU の使用率が 70%を超えた場合はワーニング、90%を超えた場合はクリティカルとするという直感的（いわば職人芸）の設定もできた。しかし、異常検知ではこのようなことが出来ず、センシティビティというものを選択する必要がある。このセンシティビティをどのように設定すべきかを考える必要があるが、[ヘルプページ](https://mackerel.io/ja/docs/entry/anomaly-detection-for-roles)の説明を読んでもよく分からないと感じた。

> Sensitivity: sensitive のほうが小さな変化に反応しやすくなる。大きな変化のみアラートを発報したい場合は insensitive を設定する

過去のデータをもとに sensitive を設定した場合はこういったときにアラートが発生、insensitive を設定した場合はこういったときにアラートが発生するというのが、監視ルールを作成するときに把握できると設定判断がしやすくなる。ただし現状はそのようなことが出来ない。始めは sensitive で監視ルールを作成し、アラートが発生してもサービスへの影響が問題ないと判断できれば normal や insensitive に変更するのが現実的な進め方である。
