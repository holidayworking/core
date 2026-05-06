---
date: 2015-06-27 18:50:00 +0900
title: xhyve で FreeBSD を動かしてみた
tags:
  - osx
  - xhyve
  - freebsd
images:
  - blog/2015/06/27/01/20150627183706.png
---

xhyve で FreeBSD をサポートさせるプルリクを見つけたので、xhyve で FreeBSD を動かしてみた。

{{< hatenablog-parts url="https://github.com/mist64/xhyve/pull/30" >}}

## xhyve のビルド

プルリクのトピックブランチを取得して xhyve をビルドした。

```bash
$ git clone git@github.com:mist64/xhyve.git
$ cd xhyve
$ git checkout -b xez-freebsd master
$ git pull git@github.com:xez/xhyve.git freebsd
$ make
```

これで FreeBSD に対応した xhyve のバイナリーが生成される。

## FreeBSD の起動

### 起動用スクリプトの作成

次の内容で起動用スクリプト `xhyve-run-freebsd.sh` を作成した。

```bash
#!/bin/sh

USERBOOT="test/userboot.so"
BOOTVOLUME="FreeBSD-10.1-RELEASE-amd64.raw"
KERNELENV=""

MEM="-m 1G"
#SMP="-c 2"
#NET="-s 2:0,virtio-net"
#IMG_CD="-s 3,ahci-cd,/somepath/somefile.iso"
#IMG_HDD="-s 4,virtio-blk,/somepath/somefile.img"
PCI_DEV="-s 0:0,hostbridge -s 31,lpc"
LPC_DEV="-l com1,stdio"
#UUID="-U deadbeef-dead-dead-dead-deaddeafbeef"

build/xhyve -A $MEM $SMP $PCI_DEV $LPC_DEV $NET $IMG_CD $IMG_HDD $UUID -f fbsd,$USERBOOT,$BOOTVOLUME,"$KERNELENV"
```

`BOOTVOLUME` で指定している `FreeBSD-10.1-RELEASE-amd64.raw` は[ここ](http://ftp.freebsd.org/pub/FreeBSD/releases/VM-IMAGES/10.1-RELEASE/amd64/Latest/)からダウンロードしてきたものである。

## 起動

```bash
$ sudo ./xhyve-run-freebsd.sh
```

FreeBSD のブートメニューが表示される。

{{< screenshot src="20150627183706.png" >}}

ただし、ディスクをマウントできず、ブート中にエラーが発生してしまった。

{{< screenshot src="20150627184726.png" >}}

FreeBSD にディスクを認識されていないため、マウントに失敗するようである。
