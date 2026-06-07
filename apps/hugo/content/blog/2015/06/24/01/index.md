---
date: 2015-06-24 07:30:00 +0900
title: Docker Machine で RancherOS を起動してみる
tags:
  - docker
  - rancheros
---

Docker Machine で RancherOS が起動できるようになっていたので、早速試してみることにした。

{{< hatenablog-parts url="https://blog.docker.com/2015/06/compose-1-3-swarm-0-3-machine-0-3/" >}}

`virtualbox-boot2docker-url`オプションに RancherOS の ISO イメージの URL を指定して、マシンを作成するようにする。`virtualbox-boot2docker-url`オプションを指定しない場合は boot2docker でマシンが作成されるようになっている。

```bash
$ docker-machine create -driver virtualbox --virtualbox-boot2docker-url https://releases.rancher.com/os/v0.3.1/machine-rancheros.iso RancherOS
Downloading boot2docker.iso from https://releases.rancher.com/os/v0.3.1/machine-rancheros.iso...
Creating VirtualBox VM...
Creating SSH key...
Starting VirtualBox VM...
Starting VM...
To see how to connect Docker to this machine, run: docker-machine env RancherOS
```

作成したマシンへのログインして、本当に RancherOS が起動されているかを確かめてみた。

```bash
$ docker-machine ssh RancherOS
[docker@RancherOS ~]$ cat /etc/lsb-release
DISTRIB_ID=RancherOS
DISTRIB_RELEASE=v0.3.1
DISTRIB_DESCRIPTION="RancherOS v0.3.1"
[docker@RancherOS ~]$ ps axuww | head -n 2
PID   USER     COMMAND
    1 root     {system-docker} docker -d --log-driver syslog -s overlay -b docker-sys --fixed-cidr 172.18.42.1/16 --restart=false -g /var/lib/system-docker -G root -H unix:///var/run/system-docker.sock
```
