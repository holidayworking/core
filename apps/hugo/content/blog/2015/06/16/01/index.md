---
date: 2015-06-16 08:00:00 +0900
title: RancherOS Lite を試してみた
tags:
  - osx
  - xhyve
  - linux
  - rancheros
  - docker
---

RancherOS の軽量バージョンである RancherOS Lite を試してみた。

{{< hatenablog-parts url="https://github.com/ailispaw/rancheros-lite" >}}

## RancherOS Lite とは

[Only Docker]（Only Docker）と同じように[RancherOS](https://github.com/rancherio/os)の軽量バージョンであるらしい。RancherOS の特徴のひとつであるシステム Docker という概念を持っていないけど、[RancherOS Base](https://github.com/rancherio/os-base)をベースにしているものである。

## 起動方法

Vagrant（VirtualBox）で起動することを前提にしているが、xhyve でも起動できるようになったので、今回は xhyve で起動することにした。

### イメージの取得

GitHub のレポジトリを取得して make するとイメージが取得される。

```bash
$ git clone git@github.com:ailispaw/rancheros-lite.git
$ cd rancheros-lite/contrib/xhyve
$ make
curl -OL https://github.com/ailispaw/rancheros-lite/releases/download/v0.5.0/rancheros-lite.iso
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   396    0   396    0     0    476      0 --:--:-- --:--:-- --:--:--   477
100 20.0M  100 20.0M    0     0   801k      0  0:00:25  0:00:25 --:--:-- 1187k
hdiutil mount rancheros-lite.iso
/dev/disk4                                              /Volumes/RANCHEROS_LITE
cp /Volumes/RANCHEROS_LITE/boot/initrd .
hdiutil unmount /Volumes/RANCHEROS_LITE
"/Volumes/RANCHEROS_LITE" unmounted successfully.
hdiutil mount rancheros-lite.iso
/dev/disk4                                              /Volumes/RANCHEROS_LITE
cp /Volumes/RANCHEROS_LITE/boot/vmlinuz .
hdiutil unmount /Volumes/RANCHEROS_LITE
"/Volumes/RANCHEROS_LITE" unmounted successfully.
curl -OL https://github.com/ailispaw/rancheros-lite/releases/download/v0.5.0/rancheros-lite-packer-disk1.vmdk
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   413    0   413    0     0    526      0 --:--:-- --:--:-- --:--:--   526
100  110k  100  110k    0     0  48206      0  0:00:02  0:00:02 --:--:--  183k
rm -f -f rancheros-lite-packer-disk1.raw
VBoxManage clonehd -format RAW rancheros-lite-packer-disk1.vmdk rancheros-lite-packer-disk1.raw
0%...10%...20%...30%...40%...50%...60%...70%...80%...90%...100%
Clone hard disk created in format 'RAW'. UUID: d386e254-06bb-4ecb-8d9e-024b32a814b4
curl -L https://raw.githubusercontent.com/mitchellh/vagrant/master/keys/vagrant \
                -o insecure_private_key
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1675  100  1675    0     0   3407      0 --:--:-- --:--:-- --:--:--  3411
chmod 0600 insecure_private_key
```

## 起動

```bash
$ sudo ./xhyve-run.sh
Password:
pci 0000:00:00.0: ignoring class 0x060000 (doesn't match header type 01)
i8042: Can't read CTR while initializing i8042

RancherOS Lite: rancheros-lite /dev/ttyS0
rancheros-lite login:
```

## ログイン

ユーザーは`rancher`、パスワードは`rancher`でログインできる。

```bash
rancheros-lite login: rancher
Password:
[rancher@rancheros-lite ~]$
```

PID 1 で Docker が起動しているのか確認してみたら、本当に PID 1 で Docker が起動していた。

```bash
[rancher@rancheros-lite ~]$ ps -ef | grep docker
    1 root     docker -d -D -s overlay -g /var/lib/docker -H unix:// -H tcp://0.0.0.0:2375
  306 root     grep docker
```

あとは普通に Docker を使えばよい。

```bash
[rancher@rancheros-lite ~]$ docker run -i -t ubuntu /bin/bash
Unable to find image 'ubuntu:latest' locally
latest: Pulling from ubuntu
428b411c28f0: Pull complete
435050075b3f: Pull complete
9fd3c8c9af32: Pull complete
6d4946999d4f: Already exists
ubuntu:latest: The image you are pulling has been verified. Important: image verification is a tech preview feature and should not be relied on to provide security.
Digest: sha256:45e42b43f2ff4850dcf52960ee89c21cda79ec657302d36faaaa07d880215dd9
Status: Downloaded newer image for ubuntu:latest
root@3c8a58e196a5:/# uname -a
Linux 3c8a58e196a5 4.0.5-rancher #1 SMP Sun Jun 7 20:31:57 UTC 2015 x86_64 x86_64 x86_64 GNU/Linux
root@3c8a58e196a5:/# cat /etc/lsb-release
DISTRIB_ID=Ubuntu
DISTRIB_RELEASE=14.04
DISTRIB_CODENAME=trusty
DISTRIB_DESCRIPTION="Ubuntu 14.04.2 LTS"
root@3c8a58e196a5:/# exit
exit
[rancher@rancheros-lite ~]$ docker ps -a
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS                     PORTS               NAMES
3c8a58e196a5        ubuntu:latest       "/bin/bash"         17 seconds ago      Exited (0) 4 seconds ago                       silly_lovelace
```

現状をは NFS によるファイル共有をサポートしていないため、OS X から docker コマンドを実行する場合はボリューム機能が使えないので注意する必要がある。
