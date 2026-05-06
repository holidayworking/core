---
date: 2015-06-02 23:21:11 +0900
title: Hyper は App Container もサポートする予定らしい
tags:
  - linux
  - hyper
  - appc
---

ハイパーバイザー・ベースの Docker エンジンである [Hyper](https://hyper.sh)。

Docker しかサポートしないだろうと思っていたら、[App Container (appc)](https://github.com/appc/spec) もサポートする予定らしい。

{{< x user="hyper_sh" id="605311806404325376" >}}

[rkt](https://github.com/coreos/rkt) をサポートする予定はないのかという質問に対して、ロードマップには appc をサポートする予定があると答えている。appc は標準的なコンテナの仕様であり、rkt は標準的なコンテナを動かすためのランタイムであるため、Hyper が appc をサポートするのは理解できる。

あと、Hyper のロードマップを見てみたいのだけど、公開されていないのかな。
