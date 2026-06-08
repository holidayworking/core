---
date: 2015-06-29 08:00:00 +0900
title: Hyper 0.2 のリリース
tags:
  - linux
  - hyper
images:
  - blog/2015/06/29/01/20150628225159.png
---

ハイパーバイザー・ベースの Docker エンジンである Hyper の最新バージョンとなる 0.2 がリリースされていた。

> - Support Xen Hypervisor (Xen 4.5/hvm)
>   - fully support run, stop, replace and persistent mode as the kvm version
> - overlayfs storage engine support.
>
> [v0\.2 \(2015\-06\-26\) \| About Hyper](https://docs.hyper.sh/release_notes/v0.2.html)

hyper がサポートしているハイパーバイザーは KVM のみであったが、このリリースからは Xen のサポートも追加されることになった。

リリースノートに書かれていないが、試したところポートフォワーディングがサポートされるようになっていた。

## Xen のサポート

ハイパーバイザーとして Xen を使う場合は、Xen 4.5 が必要となる。また、Hyper のセットアップスクリプトが KVM とは違うものを実行する必要があるため、注意する必要がある。

```bash
$ curl -sSL https://hyper.sh/install-xen | bash
```

因みにこのスクリプトを実行しても KVM を使うことができるが、Xen 4.5 がインストールされている必要がある。

## ポートフォワーディングのサポート

Nginx の Docker イメージでポートフォワーディングを試してみることにした。

ポートフォワーディングを行う場合は Podfile で VM インスタンスを用意する必要があるので、次のような Podfile を準備した。

```json
{
  "name": "nginx",
  "containers": [
    {
      "image": "nginx:latest",
      "ports": [
        {
          "containerPort": 80,
          "hostPort": 8080
        }
      ]
    }
  ],
  "resource": {
    "vcpu": 1,
    "memory": 128
  }
}
```

これを`nginx.pod`というファイル名で保存して、VM インスタンスの作成・起動をしてみた。

```bash
$ sudo hyper create nginx.pod
Pod ID is pod-fuUdqxViKw
$ sudo hyper start pod-fuUdqxViKw
Successfully started the Pod(pod-fuUdqxViKw)
```

VM インスタンスの起動が完了したら、Hyper を実行している環境の 8080 ポートにアクセスしてみたところ…。

{{< screenshot src="20150628225159.png" >}}

Nginx へアクセスできるようになっていた。

iptables のルールを確認してみると 8080 ポートが VM インスタンスの 80 ポートにフォワーディングされるように設定されていることも確認できた。

```bash
$ sudo hyper exec pod-fuUdqxViKw ip addr show eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 52:54:f4:a5:b6:d4 brd ff:ff:ff:ff:ff:ff
    inet 192.168.123.3/24 scope global eth0
       valid_lft forever preferred_lft forever
$ sudo iptables -L -t nat
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination
HYPER      all  --  anywhere             anywhere             ADDRTYPE match dst-type LOCAL
DOCKER     all  --  anywhere             anywhere             ADDRTYPE match dst-type LOCAL

Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
HYPER      all  --  anywhere            !127.0.0.0/8          ADDRTYPE match dst-type LOCAL
DOCKER     all  --  anywhere            !127.0.0.0/8          ADDRTYPE match dst-type LOCAL

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination
MASQUERADE  all  --  192.168.123.0/24     anywhere
MASQUERADE  all  --  172.17.0.0/16        anywhere

Chain DOCKER (2 references)
target     prot opt source               destination

Chain HYPER (2 references)
target     prot opt source               destination
DNAT       tcp  --  anywhere             anywhere             tcp dpt:http-alt to:192.168.123.3:80
```

ポートフォワーディングがサポートされたので、今度は Rails などの Web アプリケーションを動かすことに挑戦することを考えている。
