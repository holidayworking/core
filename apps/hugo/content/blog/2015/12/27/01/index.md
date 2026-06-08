---
date: 2015-12-27 15:20:00 +0900
title: サーバーサイド Swift フレームワークである Perfect を Docker で動かせるようにした
tags:
  - docker
  - swift
  - perfect
images:
  - blog/2015/12/27/01/20151227150946.png
---

サーバーサイド Swift フレームワークである[Perfect](https://www.perfect.org)を Docker で動かせるようにした。

{{< hatenablog-parts url="https://github.com/holidayworking/docker-perfect" >}}

作成した Docker イメージは[Docker Hub](https://hub.docker.com/r/holidayworking/perfect/)でも公開しているので、次のように実行するとビルド済みのイメージが取得できる。

```bash
$ docker pull holidayworking/perfect
```

この Docker イメージではサンプルアプリケーションである[URL Routing](https://github.com/PerfectlySoft/Perfect/tree/master/Examples/URL%20Routing)を実行するようにしている。

```bash
$ docker run -d -p 8181:8181 holidayworking/docker-perfect
```

実行後に`http://localhost:8181/foo/bar/baz`へアクセスすると次のように表示される。

{{< screenshot src="20151227150946.png" >}}

Docker イメージを構築するときにハマった点はコンパイルした Perfect アプリケーションを実行する方法である。アプリケーションをコンパイルすると so ファイルが生成されるが、このファイルを`perfectserverhttp`を実行するディレクトリ内の`PerfectLibraries`ディレクトリにコピーするか、シンボリックリンクを貼ってある必要がある。最初はこれが分からなくて、サンプルアプリケーションのディレクトリ内で`perfectserverhttp`を実行して、上手くいかないと悩んでいた…。
