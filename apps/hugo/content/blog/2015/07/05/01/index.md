---
date: 2015-07-05 14:05:00 +0900
title: FreeBSD on xhyve でディスクをマウントできた
tags:
  - osx
  - xhyve
  - freebsd
---

前に xhyve で FreeBSD を動かしたときにディスクのマウントに失敗すると書いた。

{{< hatenablog-parts url="https://holidayworking.org/blog/2015/06/27/01/" >}}

原因と解決方法が分かったので補足しておく。

## 原因

`BOOTVOLUME`を定義していれば`IMG_HDD`の定義は不要だと勘違いしていたが、`IMG_HDD`の定義も必要であるらしい。この前は`IMG_HDD`を定義していなかったので、ディスクのマウントに失敗していたのである。

{{< hatenablog-parts url="https://github.com/mist64/xhyve/issues/34" >}}

## 解決方法

原因が分かったので起動用スクリプトを次のように修正した。

```sh
#!/bin/sh

USERBOOT="test/userboot.so"
BOOTVOLUME="FreeBSD-10.1-RELEASE-amd64.raw"
KERNELENV=""

MEM="-m 1G"
#SMP="-c 2"
#NET="-s 2:0,virtio-net"
#IMG_CD="-s 3,ahci-cd,/somepath/somefile.iso"
IMG_HDD="-s 4,virtio-blk,FreeBSD-10.1-RELEASE-amd64.raw"
PCI_DEV="-s 0:0,hostbridge -s 31,lpc"
LPC_DEV="-l com1,stdio"
#UUID="-U deadbeef-dead-dead-dead-deaddeafbeef"

build/xhyve -A $MEM $SMP $PCI_DEV $LPC_DEV $NET $IMG_CD $IMG_HDD $UUID -f fbsd,$USERBOOT,$BOOTVOLUME,"$KERNELENV"
```

そうしたら、問題無くディスクがマウントされて FreeBSD が起動した。
