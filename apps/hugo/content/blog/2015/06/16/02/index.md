---
date: 2015-06-16 23:10:00 +0900
title: xhyve で CentOS 7 を動かしてみた
tags:
  - osx
  - xhyve
  - linux
  - centos
images:
  - blog/2015/06/16/02/20150616230331.png
---

xhyve で CentOS 7 を動かしてみた。

大体の手順は[xhyve – Lightweight Virtualization on OS X Based on bhyve – pagetable\.com](https://www.pagetable.com/?p=831)で書かれている Ubuntu Server の動かし方と変わらないが、CentOS であることを考慮する必要があった。

1. インストールディスクイメージの取得
2. インストール用スクリプトの作成
3. CentOS のインストール
4. 起動用スクリプトの作成
5. CentOS の起動

この手順で基本的に RHEL や Fedora を動かすことができるはずである。

<!-- more -->

## 手順

### 1. インストールディスクイメージの取得

適当なミラーサーバーからインストールディスクイメージを取得する。

```bash
$ wget http://ftp-srv2.kddilabs.jp/Linux/packages/CentOS/7/isos/x86_64/CentOS-7-x86_64-Minimal-1503-01.iso
```

CentOS ではインストールディスクイメージに含まれている vmlinuz と initrd は、ミラーサイトでも公開されているので、これらのファイルも取得する。

```bash
$ wget http://ftp-srv2.kddilabs.jp/Linux/packages/CentOS/7/os/x86_64/isolinux/vmlinuz
$ wget http://ftp-srv2.kddilabs.jp/Linux/packages/CentOS/7/os/x86_64/isolinux/initrd.img
```

また、HDD イメージを適当なサイズで作成する。

```bash
$ dd if=/dev/zero of=hdd.img bs=1g count=8
```

今回は 8GB で作成することにする。

### 2. インストール用スクリプトの作成

次の内容を`xhyve-run-centos-install.sh`というファイル名で作成する。

```sh
#!/bin/sh

KERNEL="vmlinuz"
INITRD="initrd.img"
CMDLINE="earlyprintk=serial console=ttyS0 acpi=off sshd=1 vnc vncpassword=yourpasswd"

MEM="-m 1G"
#SMP="-c 2"
NET="-s 2:0,virtio-net"
IMG_CD="-s 3,ahci-cd,CentOS-7-x86_64-Minimal-1503-01.iso"
IMG_HDD="-s 4,virtio-blk,hdd.img"
PCI_DEV="-s 0:0,hostbridge -s 31,lpc"
LPC_DEV="-l com1,stdio"

xhyve $MEM $SMP $PCI_DEV $LPC_DEV $NET $IMG_CD $IMG_HDD -f kexec,$KERNEL,$INITRD,"$CMDLINE"
```

インストール完了後に vmlinuz と initrd を OS X 側に持ってくる必要があるため、SSH を起動するようにしてある。また、VNC で接続してインストール作業をすすめるために VNC も起動するようにしてある。

### 3. CentOS のインストール

インストール用スクリプトを次のように実行する。

```bash
$ sudo ./xhyve-run-centos-install.sh
```

次のようになったら、インストーラーの起動が完了している状態である。

[f:id:holidayworking:20150616223717p:plain]

表示している IP アドレスに対して VNC クライアントで接続する。このとき注意するのは、指定するポート番号は 5901 とすることである。

[f:id:holidayworking:20150616224101p:plain]

あとはいつもとおりにインストールを進めればよい。

[f:id:holidayworking:20150616224433p:plain]

vmlinuz と initrd を OS X 側に持ってくる必要があるため、この画面になったら「再起動」ボタンを押さないようにする必要がある。

```bash
$ ssh root@192.168.64.15
The authenticity of host '192.168.64.15 (192.168.64.15)' can't be established.
RSA key fingerprint is 5a:72:5b:06:e4:04:12:9e:43:4e:7e:19:98:e1:dc:9d.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '192.168.64.15' (RSA) to the list of known hosts.
[anaconda root@localhost ~]# ls -l /mnt/sysimage/boot/
total 69736
-rw-------. 1 root root  2881257 Mar  6 11:45 System.map-3.10.0-229.el7.x86_64
-rw-r--r--. 1 root root   123838 Mar  6 11:45 config-3.10.0-229.el7.x86_64
drwxr-xr-x. 2 root root       26 Jun 16 13:40 grub
drwxr-xr-x. 6 root root      104 Jun 16 13:43 grub2
-rw-r--r--. 1 root root 39835714 Jun 16 13:42 initramfs-0-rescue-27a09f4e1e364fc5839a0440166c5e74.img
-rw-r--r--. 1 root root 17666894 Jun 16 13:43 initramfs-3.10.0-229.el7.x86_64.img
-rw-r--r--. 1 root root   589454 Jun 16 13:41 initrd-plymouth.img
-rw-r--r--. 1 root root   240039 Mar  6 11:47 symvers-3.10.0-229.el7.x86_64.gz
-rwxr-xr-x. 1 root root  5029136 Jun 16 13:42 vmlinuz-0-rescue-27a09f4e1e364fc5839a0440166c5e74
-rwxr-xr-x. 1 root root  5029136 Mar  6 11:45 vmlinuz-3.10.0-229.el7.x86_64
```

`vmlinuz-3.10.0-229.el7.x86_64`と`initramfs-3.10.0-229.el7.x86_64.img`を OS X 側に持ってくる。

```bash
$ scp root@192.168.64.15:/mnt/sysimage/boot/vmlinuz-3.10.0-229.el7.x86_64 .
$ scp root@192.168.64.15:/mnt/sysimage/boot/initramfs-3.10.0-229.el7.x86_64.img .
```

起動用スクリプトに記載するブートオプションの参考にするため、`grub.cfg`も持ってくる。

```bash
$ scp root@192.168.64.15:/mnt/sysimage/boot/grub2/grub.cfg .
```

「再起動」ボタンを押して、インストーラーを終了する。

### 4. 起動用スクリプトの作成

次の内容を`xhyve-run-centos.sh`というファイル名で作成する。

```bash
#!/bin/sh

KERNEL="vmlinuz-3.10.0-229.el7.x86_64"
INITRD="initramfs-3.10.0-229.el7.x86_64.img"
CMDLINE="root=/dev/mapper/centos-root ro rd.lvm.lv=centos/root rd.lvm.lv=centos/swap crashkernel=auto acpi=off console=ttyS0"

MEM="-m 1G"
#SMP="-c 2"
NET="-s 2:0,virtio-net"
IMG_HDD="-s 4,virtio-blk,hdd.img"
PCI_DEV="-s 0:0,hostbridge -s 31,lpc"
LPC_DEV="-l com1,stdio"

xhyve $MEM $SMP $PCI_DEV $LPC_DEV $NET $IMG_CD $IMG_HDD -f kexec,$KERNEL,$INITRD,"$CMDLINE"
```

`KERNEL`と`INITRD`は持ってきた vmlinuz と initrd を指定する。

`CMDLINE`については`grub.cfg`の 90 行目当たりの内容を指定する。

```bash
menuentry 'CentOS Linux 7 (Core), with Linux 3.10.0-229.el7.x86_64' --class rhel fedora --class gnu-linux --class gnu --class os --unrestricted $menuentry_id_option 'gnulinux-3.10.0-229.el7.x86_64-advanced-15a33d58-bcf2-403c-99b2-29ec5bd3866d' {
 load_video
 set gfxpayload=keep
 insmod gzio
 insmod part_msdos
 insmod xfs
 set root='hd0,msdos1'
 if [ x$feature_platform_search_hint = xy ]; then
   search --no-floppy --fs-uuid --set=root --hint='hd0,msdos1'  7ee47c06-da2b-479b-9a6f-0ba2a52c5cea
 else
   search --no-floppy --fs-uuid --set=root 7ee47c06-da2b-479b-9a6f-0ba2a52c5cea
 fi
 linux16 /vmlinuz-3.10.0-229.el7.x86_64 root=/dev/mapper/centos-root ro rd.lvm.lv=centos/root rd.lvm.lv=centos/swap crashkernel=auto acpi=off console=ttyS0 LANG=ja_JP.UTF-8
 initrd16 /initramfs-3.10.0-229.el7.x86_64.img
}
```

### 5. CentOS の起動

起動用スクリプトを次のように実行する。

```bash
$ sudo ./xhyve-run-centos.sh
```

{{< screenshot src="20150616230331.png" >}}

## 参考

- [RHEL 6\.6 on xhyve \- りおてく](https://web.archive.org/web/20151207033928/http://rio.tc/2015/06/rhel-66-on-xhyve.html)
