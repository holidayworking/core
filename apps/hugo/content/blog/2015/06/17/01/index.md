---
date: 2015-06-17 23:25:00 +0900
title: RancherOS Lite with xhyve で NFS によるファイル共有がサポートされた
tags:
  - osx
  - xhyve
  - linux
  - rancheros
  - docker
images:
  - blog/2015/06/17/01/20150617232055.png
---

次の記事で[RancherOS Lite with xhyve](https://github.com/ailispaw/rancheros-lite/tree/master/contrib/xhyve)では NFS によるファイル共有がサポートされてないと書いた。

{{< hatenablog-parts url="https://holidayworking.org/blog/2015/06/16/01/" >}}

そうしたところ、作者の ailispaw さんが、早速 NFS によるファイル共有をサポートしてくれたので、Docker のボリューム機能が使えるかを試してみた。

## RancherOS Lite の起動

```bash
$ git clone git@github.com:ailispaw/rancheros-lite.git
$ cd rancheros-lite/contrib/xhyve
$ make
$ sudo ./xhyve-run.sh
```

起動が完了したら、ログインして IP アドレスを確認しておく。

```bash
[rancher@rancheros-lite ~]$ ip addr show eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast qlen 1000
    link/ether 32:70:cb:56:cf:32 brd ff:ff:ff:ff:ff:ff
    inet 192.168.64.3/24 brd 192.168.64.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::e858:48d4:e359:6504/64 scope link
       valid_lft forever preferred_lft forever
```

## Docker のボリューム機能の確認

OS X 側に適当な HTML ファイルを作成して、[nginx](https://registry.hub.docker.com/_/nginx/)でそのファイルが表示できるかを確認してみた。

```bash
$ echo '<h1>Hello RancherOS Lite</h1>' > index.html
$ docker -H 192.168.64.3:2375 run -d -p 80:80 -v `pwd`:/usr/share/nginx/html:ro nginx
```

ブラウザで`http://192.168.64.3`にアクセスしたところ、OS X 側に作成した HTML ファイルを表示できた。

{{< screenshot src="20150617232055.png" >}}
