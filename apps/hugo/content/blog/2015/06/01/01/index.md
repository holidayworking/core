---
date: 2015-06-01 09:00:00 +0900
title: Hyper を試してみた
tags:
  - linux
  - hyper
---

ハイパーバイザー・ベースの Docker エンジンである Hyper を試してみた。

普通の Docker エンジンが採用しているコンテナ型仮想化のメリットとハイパーバイザー型仮想化のメリットを組合せた印象を受ける。コンテナ型仮想化、ハイパーバイザー型仮想化と Hyper がどのように違うのかは、[Why Hyper | Hyper - Make VM run like Container](https://hyper.sh/why-hyper.html)にまとまっている。

現時点でサポートしている Linux ディストリビューションは次のとおりである。

- Ubuntu 15.04
- Ubuntu 14.10
- Ubuntu 14.04
- CentOS 7.0
- CentOS 6.x
- Fedora 21
- Fedora 22
- Debian 7.4

いずれかのディストリビューションを使う場合にしても、64 ビットを選択する必要がある。また、次のパッケージが必要となる。

- QEMU 2.0 以上
- Docker 1.5 以上

今回は Vagrant（VirtualBox）で起動した Ubuntu 14.04 で試すことにした。作成した`Vagrantfile`は GitHub に公開している。

{{< hatenablog-parts url="http://github.com/holidayworking/vagrant-hyper" >}}

この`Vagrantfile`では、プロビジョニングで QEMU と Docker をインストールして、Ubuntu の Docker イメージを取得するようにしてある。Hyper のセットアップスクリプトの実行もプロビジョニングに含めたかったが、正常に実行してくれたなかったので含めていない。

## Hyper のインストール

セットアップスクリプトが公開されているので、このスクリプトを実行するだけでよい。

```bash
$ curl -sSL https://hyper.sh/install | bash
```

このスクリプトでは次のことが実行される。

- Linux ディストリビューションのチェック
  - サポートしていないディストリビューションで実行した場合はエラー
- Docker 1.5 のインストールチェック
- QEMU 2.0 のインストールチェック
- Hyper のインストール
- Hyper の起動

なお、実行結果は次のような感じになる。

```bash
$ curl -sSL https://hyper.sh/install | bash

Hint: Hyper installer need root privilege

Check dependency ..... Done


Fetch package .. Done


Installing .. Done


Start hyperd service
 * Starting hyperd: hyperd
   ...done.

hyperd is running.
----------------------------------------------------
To see how to use hyper cli:
    sudo hyper help

To manage hyperd service:
    sudo service hyperd {start|stop|restart|status}

To get more information:
    http://hyper.sh
```

## VM の起動

起動したい Docker イメージを事前に取得しておいて、`hyper run <docker image name>`を実行すると VM として起動される。

```bash
$ docker pull ubuntu:latest
$ sudo hyper run ubuntu:latest
```

オプションを付けずに起動した場合は、VM へアタッチされるようになっている。

```bash
$ sudo hyper run ubuntu:latest
POD id is pod-zPMlOJsrID
root@ubuntu:latest-6107126173:/#
```

現時点でカーネルは 4.0.0-rc5 が使われていることが分かる。

```bash
root@ubuntu:latest-6107126173:/# uname -a
Linux ubuntu:latest-6107126173 4.0.0-rc5+ #15 SMP Sat Apr 11 13:03:47 CST 2015 x86_64 x86_64 x86_64 GNU/Linux
```

別のターミナルでプロセスを確認すると、QEMU で Docker イメージが起動されていることが分かる。

```bash
vagrant@vagrant-ubuntu-trusty-64:~$ ps aux | grep qemu | grep -v 'grep'
root     18919  6.8 18.0 761572 90696 ?        Ssl  13:40   0:02 qemu-system-x86_64 -machine pc-i440fx-2.0,usb=off -cpu core2duo -drive if=pflash,file=/var/lib/hyper/bios-qboot.bin,readonly=on -drive if=pflash,file=/var/lib/hyper/cbfs-qboot.rom,readonly=on -realtime mlock=off -no-user-config -nodefaults -no-hpet -rtc base=utc,driftfix=slew -no-reboot -display none -boot strict=on -m 128 -smp 1 -qmp unix:/var/run/hyper/vm-bxGPTaWcio/qmp.sock,server,nowait -serial unix:/var/run/hyper/vm-bxGPTaWcio/console.sock,server,nowait -device virtio-serial-pci,id=virtio-serial0,bus=pci.0,addr=0x2 -device virtio-scsi-pci,id=scsi0,bus=pci.0,addr=0x3 -chardev socket,id=charch0,path=/var/run/hyper/vm-bxGPTaWcio/hyper.sock,server,nowait -device virtserialport,bus=virtio-serial0.0,nr=1,chardev=charch0,id=channel0,name=sh.hyper.channel.0 -chardev socket,id=charch1,path=/var/run/hyper/vm-bxGPTaWcio/tty.sock,server,nowait -device virtserialport,bus=virtio-serial0.0,nr=2,chardev=charch1,id=channel1,name=sh.hyper.channel.1 -fsdev local,id=virtio9p,path=/var/run/hyper/vm-bxGPTaWcio/share_dir,security_model=none -device virtio-9p-pci,fsdev=virtio9p,mount_tag=share_dir
```

## VM のリストを取得

`hyper list`を実行すると VM のリストを取得できる。

```bash
$ sudo hyper list
         POD ID                      POD Name             VM name    Status
 pod-zPMlOJsrID                        ubuntu   latest-6107126173vm-bxGPTaWcio
```

## VM の停止

VM にアタッチしている場合は、普通の Docker エンジンと同様に`exit`コマンドを実行することで VM の停止ができるようである。

```bash
root@ubuntu:latest-6107126173:/# exit
exit
vagrant@vagrant-ubuntu-trusty-64:~$ sudo hyper list
         POD ID                      POD Name             VM name    Status
 pod-zPMlOJsrID                        ubuntu   latest-6107126173
```
