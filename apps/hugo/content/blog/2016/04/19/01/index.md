---
date: 2016-04-19 23:05:00 +0900
title: Docker for Mac のメモリサイズを変更する方法
tags:
  - mac
  - docker
images:
  - blog/2016/04/19/01/20160419225437.png
---

Docker for Mac の設定画面でメモリサイズを変更しようとしたけど、スライダーを動かすことが出来ない状態だったので変更することが出来なかった。

{{< screenshot src="20160419225437.png" >}}

正式版では設定画面から変更できるようになるはずだが、現時点では`pinata`というコマンドを使う必要があるようだ。

たとえば、メモリサイズを 4GB に変更したい場合は次のように実行する。

```bash
$ pinata set hypervisor native memory=4
```
