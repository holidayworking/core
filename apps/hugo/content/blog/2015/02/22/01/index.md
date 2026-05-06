---
date: 2015-02-22 15:17:00 +0900
title: CentOS Atomic Host で固定 IP の設定方法
tags:
  - linux
  - centos
---

CentOS Atomic Host は CentOS 7 がベースとなっているので、NetworkManager で固定 IP を設定できる。

```bash
$ sudo nmcli d
デバイス  タイプ    状態                       接続
eth0      ethernet  接続済み                   Wired connection 1
docker0   bridge    接続中（IP 設定を取得中）  docker0
lo        loopback  管理無し                   --
$ sudo nmcli c modify 'Wired connection 1' ipv4.addresses "192.168.0.3/24 192.168.0.1" ipv4.method manual
$ sudo nmcli c modify 'Wired connection 1' +ipv4.dns 8.8.8.8
$ sudo nmcli c modify 'Wired connection 1' +ipv4.dns 8.8.4.4
$ sudo nmcli c up 'Wired connection 1'
$ ip addr show eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
    link/ether 52:54:00:fc:0e:d2 brd ff:ff:ff:ff:ff:ff
    inet 192.168.0.3/24 brd 192.168.0.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 2407:c800:2202:5e01:5054:ff:fefc:ed2/64 scope global dynamic
       valid_lft 604782sec preferred_lft 604782sec
    inet6 fe80::5054:ff:fefc:ed2/64 scope link
       valid_lft forever preferred_lft forever
```
