---
date: 2015-06-20 18:45:00 +0900
title: xhyve で Fedora 22 を動かしてみた
tags:
  - osx
  - xhyve
  - linux
  - fedora
images:
  - blog/2015/06/20/01/20150620165426.png
---

xhyve で Fedora 22 を動かしてみた。

CentOS 7 と手順は変わらないので、次のようになる。

1. インストールディスクイメージの取得
2. インストール用スクリプトの作成
3. Fedora のインストール
4. 起動用スクリプトの作成
5. Fedora の起動

## 手順

### 1. インストールディスクイメージの取得

適当なミラーサーバーからインストールディスクイメージを取得する。

```bash
$ curl -O http://ftp-srv2.kddilabs.jp/Linux/packages/fedora/releases/22/Server/x86_64/iso/Fedora-Server-netinst-x86_64-22.iso
```

CentOS ではインストールディスクイメージに含まれている vmlinuz と initrd は、ミラーサイトでも公開されているので、これらのファイルも取得する。

```bash
$ curl -O http://ftp-srv2.kddilabs.jp/Linux/packages/fedora/releases/22/Server/x86_64/os/isolinux/vmlinuz
$ curl -O http://ftp-srv2.kddilabs.jp/Linux/packages/fedora/releases/22/Server/x86_64/os/isolinux/initrd.img
```

また、HDD イメージを適当なサイズで作成する。

```bash
$ dd if=/dev/zero of=hdd.img bs=1g count=8
```

今回は 8GB で作成することにする。

### 2. インストール用スクリプトの作成

次の内容を `xhyve-run-fedora-install.sh` というファイル名で作成する。

```bash
#!/bin/sh

KERNEL="vmlinuz"
INITRD="initrd.img"
CMDLINE="earlyprintk=serial console=ttyS0 acpi=off sshd=1 vnc vncpassword=yourpasswd"

MEM="-m 1G"
#SMP="-c 2"
NET="-s 2:0,virtio-net"
IMG_CD="-s 3,ahci-cd,Fedora-Server-netinst-x86_64-22.iso"
IMG_HDD="-s 4,virtio-blk,hdd.img"
PCI_DEV="-s 0:0,hostbridge -s 31,lpc"
LPC_DEV="-l com1,stdio"

xhyve $MEM $SMP $PCI_DEV $LPC_DEV $NET $IMG_CD $IMG_HDD -f kexec,$KERNEL,$INITRD,"$CMDLINE"
```

インストール完了後に vmlinuz と initrd を OS X 側に持ってくる必要があるため、SSH を起動するようにしてある。また、VNC で接続してインストール作業をすすめるために VNC も起動するようにしてある。

### 3. Fedora のインストール

インストール用スクリプトを次のように実行する。

```bash
$ sudo ./xhyve-run-fedora-install.sh
```

次のようになったら、インストーラーの起動が完了している状態である。

{{< screenshot src="20150620160504.png" >}}

表示している IP アドレスに対して VNC クライアントで接続する。このとき注意するのは、指定するポート番号は 5901 とすることである。

{{< screenshot src="20150620160529.png" >}}

あとはいつもとおりにインストールを進めればよい。

{{< screenshot src="20150620161244.png" >}}

vmlinuz と initrd を OS X 側に持ってくる必要があるため、この画面になったら「再起動」ボタンを押さないようにする必要がある。

```bash
$ ssh root@192.168.64.22
The authenticity of host '192.168.64.22 (192.168.64.22)' can't be established.
RSA key fingerprint is 26:65:24:c8:52:6e:ae:23:35:6b:a8:4e:c4:f1:64:c6.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '192.168.64.22' (RSA) to the list of known hosts.
[anaconda root@localhost ~]# ls -l /mnt/sysimage/boot/
total 78439
-rw-------. 1 root root  3052614 May 28 12:43 System.map-4.0.4-303.fc22.x86_64
-rw-r--r--. 1 root root   154760 May 28 12:43 config-4.0.4-303.fc22.x86_64
drwxr-xr-x. 6 root root     1024 Jun 20 07:05 grub2
-rw-r--r--. 1 root root 44783265 Jun 20 07:03 initramfs-0-rescue-d6dff6f06bf246459b4c73a972e456db.img
-rw-r--r--. 1 root root 20296291 Jun 20 07:04 initramfs-4.0.4-303.fc22.x86_64.img
-rw-r--r--. 1 root root   211972 Jun 20 07:04 initrd-plymouth.img
drwx------. 2 root root    12288 Jun 20 06:57 lost+found
-rwxr-xr-x. 1 root root  5897880 Jun 20 07:04 vmlinuz-0-rescue-d6dff6f06bf246459b4c73a972e456db
-rwxr-xr-x. 1 root root  5897880 May 28 12:43 vmlinuz-4.0.4-303.fc22.x86_64
```

`vmlinuz-4.0.4-303.fc22.x86_64` と `initramfs-4.0.4-303.fc22.x86_64.img` を OS X 側に持ってくる。

```bash
$ scp root@192.168.64.22:/mnt/sysimage/boot/vmlinuz-4.0.4-303.fc22.x86_64 .
$ scp root@192.168.64.22:/mnt/sysimage/boot/initramfs-4.0.4-303.fc22.x86_64.img .
```

起動用スクリプトに記載するブートオプションの参考にするため、`grub.cfg` も持ってくる。

```bash
$ scp root@192.168.64.22:/mnt/sysimage/boot/grub2/grub.cfg .
```

「再起動」ボタンを押して、インストーラーを終了する。

### 4. 起動用スクリプトの作成

次の内容を `xhyve-run-fedora.sh` というファイル名で作成する。

```bash
#!/bin/sh

KERNEL="vmlinuz-4.0.4-303.fc22.x86_64"
INITRD="initramfs-4.0.4-303.fc22.x86_64.img"
CMDLINE="root=/dev/mapper/fedora-root ro rd.lvm.lv=fedora/swap rd.lvm.lv=fedora/root acpi=off console=ttyS0 LANG=ja_JP.UTF-8"

MEM="-m 1G"
#SMP="-c 2"
NET="-s 2:0,virtio-net"
IMG_HDD="-s 4,virtio-blk,hdd.img"
PCI_DEV="-s 0:0,hostbridge -s 31,lpc"
LPC_DEV="-l com1,stdio"

xhyve $MEM $SMP $PCI_DEV $LPC_DEV $NET $IMG_CD $IMG_HDD -f kexec,$KERNEL,$INITRD,"$CMDLINE"
```

`KERNEL` と `INITRD` は持ってきた vmlinuz と initrd を指定する。

`CMDLINE` については `grub.cfg` の 90 行目当たりの内容を指定する。

```bash
menuentry 'Fedora (4.0.4-303.fc22.x86_64) 22 (Twenty Two)' --class fedora --class gnu-linux --class gnu --class os --unrestricted $menuentry_id_option 'gnulinux-4.0.4-303.fc22.x86_64-advanced-4789ebcc-cc67-4818-bc91-bc590f7872de' {
 load_video
 set gfxpayload=keep
 insmod gzio
 insmod part_msdos
 insmod ext2
 set root='hd0,msdos1'
 if [ x$feature_platform_search_hint = xy ]; then
   search --no-floppy --fs-uuid --set=root --hint='hd0,msdos1'  2ae3696b-ec42-44bc-b649-32c2ab4fa10e
 else
   search --no-floppy --fs-uuid --set=root 2ae3696b-ec42-44bc-b649-32c2ab4fa10e
 fi
 linux16 /vmlinuz-4.0.4-303.fc22.x86_64 root=/dev/mapper/fedora-root ro rd.lvm.lv=fedora/swap rd.lvm.lv=fedora/root acpi=off console=ttyS0 LANG=ja_JP.UTF-8
 initrd16 /initramfs-4.0.4-303.fc22.x86_64.img
}
```

### 5. Fedora の起動

起動用スクリプトを次のように実行する。

```bash
$ sudo ./xhyve-run-fedora.sh
```

{{< screenshot src="20150620161740.png" >}}

## デスクトップ環境の構築

今回は Server エディションをインストールしたので、別途デスクトップ環境を構築してみた。

```bash
$ sudo dnf group install "Fedora Workstation"
```

また、VNC サーバーのインストール・起動が必要なので、次のコマンドを実行する。

```bash
$ sudo dnf install tigervnc-server
$ vncserver :1 -geometry 1024x768
```

VNC サーバーが起動したら、VNC クライアントで接続するとデスクトップ環境が起動される。

{{< screenshot src="20150620165426.png" >}}
