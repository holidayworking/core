---
date: 2015-06-15 08:00:00 +0900
title: xhyve を試してみた
tags:
  - osx
  - xhyve
  - linux
  - boot2docker
  - docker
---

OS X のハイパーバイザーである xhyve を試してみた。

{{< hatenablog-parts url="http://www.pagetable.com/?p=831" >}}

{{< hatenablog-parts url="https://github.com/mist64/xhyve" >}}

## xhyve とは

FreeBSD のハイパーバイザーである [bhyve](http://www.bhyve.org) を OS X に移植したものであり、OS X 10.10 Yosemite に追加された Hypervisor.framework で実装されている。

### 特徴

- 超軽量で 230 KB
- スタンドアロンで依存関係はなし
- BSD ライセンス
- カーネル拡張を必要としない
  - bhyve のカーネルコードはユーザーモードコードに移植されて、Hypervisor.framework を呼び出すようになっている
- マルチ CPU をサポート
- ネットワークをサポート
- Linux ディストリビューションを実行可能
  - 他の OS も実行可能に拡張できる

### システム要件

- OS X 10.10.3 Yosemite
- 2010 年以降に発売された Mac

### 注意点

VirtualBox を起動中に xhyve を実行すると、カーネルパニックが発生するので気を付ける必要がある。

{{< hatenablog-parts url="https://github.com/mist64/xhyve/issues/5" >}}

{{< hatenablog-parts url="https://github.com/mist64/xhyve/issues/9" >}}

## インストール

GitHub のレポジトリを取得して `make` するだけで、バイナリーが生成される。

```bash
$ git clone https://github.com/mist64/xhyve
$ cd xhyve
$ make
$ cp build/xhyve /usr/local/bin
```

## Linux ディストリビューションの起動方法

[xhyve – Lightweight Virtualization on OS X Based on bhyve – pagetable\.com](https://www.pagetable.com/?p=831) では、次の Linux ディストリビューションの起動方法について解説している。

- Tiny Core Linux
- Ubuntu Server 14.04.2

また、CoreOS や boot2docker を起動するためのスクリプトがそれぞれ公開されている。

{{< hatenablog-parts url="https://github.com/coreos/coreos-xhyve" >}}

{{< hatenablog-parts url="https://github.com/ailispaw/boot2docker-xhyve" >}}

今回は Tiny Core Linux と boot2docker を起動してみた。

### Tiny Core Linux

`xhyve-run.sh` を実行するだけで Tiny Core Linux が起動される。

```bash
$ git clone https://github.com/mist64/xhyve
$ cd xhyve
$ ./xhyve-run.sh
Initializing cgroup subsys cpuset
Initializing cgroup subsys cpu
Initializing cgroup subsys cpuacct
Linux version 3.16.6-tinycore64 (tc@box) (gcc version 4.9.1 (GCC) ) #777 SMP Thu Oct 16 10:21:00 UTC 2014
Command line: earlyprintk=serial console=ttyS0 acpi=off
e820: BIOS-provided physical RAM map:
BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable
BIOS-e820: [mem 0x0000000000100000-0x000000003fffffff] usable
NX (Execute Disable) protection: active
SMBIOS 2.6 present.
AGP: No AGP bridge found
e820: last_pfn = 0x40000 max_arch_pfn = 0x400000000
x86 PAT enabled: cpu 0, old 0x7040600070406, new 0x7010600070106
CPU MTRRs all blank - virtualized system.
found SMP MP-table at [mem 0x000f0000-0x000f000f] mapped at [ffff8800000f0000]
Using GB pages for direct mapping
init_memory_mapping: [mem 0x00000000-0x000fffff]
init_memory_mapping: [mem 0x3fe00000-0x3fffffff]
init_memory_mapping: [mem 0x3c000000-0x3fdfffff]
init_memory_mapping: [mem 0x00100000-0x3bffffff]
RAMDISK: [mem 0x01e77000-0x025b8fff]
Zone ranges:
  DMA      [mem 0x00001000-0x00ffffff]
  DMA32    [mem 0x01000000-0xffffffff]
  Normal   empty
Movable zone start for each node
Early memory node ranges
  node   0: [mem 0x00001000-0x0009efff]
  node   0: [mem 0x00100000-0x3fffffff]
Intel MultiProcessor Specification v1.4
MPTABLE: OEM ID: BHyVe
MPTABLE: Product ID: Hypervisor
MPTABLE: APIC at: 0xFEE00000
Processor #0 (Bootup-CPU)
IOAPIC[0]: apic_id 0, version 17, address 0xfec00000, GSI 0-23
Processors: 1
smpboot: Allowing 1 CPUs, 0 hotplug CPUs
PM: Registered nosave memory: [mem 0x0009f000-0x000fffff]
e820: [mem 0x40000000-0xffffffff] available for PCI devices
Booting paravirtualized kernel on bare hardware
setup_percpu: NR_CPUS:8 nr_cpumask_bits:8 nr_cpu_ids:1 nr_node_ids:1
PERCPU: Embedded 27 pages/cpu @ffff88003fc00000 s80576 r8192 d21824 u2097152
Built 1 zonelists in Zone order, mobility grouping on.  Total pages: 258441
Kernel command line: earlyprintk=serial console=ttyS0 acpi=off
PID hash table entries: 4096 (order: 3, 32768 bytes)
Dentry cache hash table entries: 131072 (order: 8, 1048576 bytes)
Inode-cache hash table entries: 65536 (order: 7, 524288 bytes)
xsave: enabled xstate_bv 0x7, cntxt size 0x340
AGP: Checking aperture...
AGP: No AGP bridge found
Memory: 1014012K/1048184K available (4911K kernel code, 674K rwdata, 1328K rodata, 928K init, 748K bss, 34172K reserved)
Hierarchical RCU implementation.
        CONFIG_RCU_FANOUT set to non-default value of 32
        RCU restricting CPUs from NR_CPUS=8 to nr_cpu_ids=1.
RCU: Adjusting geometry for rcu_fanout_leaf=16, nr_cpu_ids=1
NR_IRQS:4352 nr_irqs:256 16
Console: colour dummy device 80x25
console [ttyS0] enabled
tsc: Fast TSC calibration using PIT
tsc: Detected 2194.423 MHz processor
Calibrating delay loop (skipped), value calculated using timer frequency.. 4390.71 BogoMIPS (lpj=7314743)
pid_max: default: 32768 minimum: 301
Mount-cache hash table entries: 2048 (order: 2, 16384 bytes)
Mountpoint-cache hash table entries: 2048 (order: 2, 16384 bytes)
Initializing cgroup subsys devices
Initializing cgroup subsys freezer
Initializing cgroup subsys net_cls
Initializing cgroup subsys blkio
Initializing cgroup subsys perf_event
Initializing cgroup subsys net_prio
CPU: Physical Processor ID: 0
mce: CPU supports 0 MCE banks
Last level iTLB entries: 4KB 1024, 2MB 1024, 4MB 1024
Last level dTLB entries: 4KB 1024, 2MB 1024, 4MB 1024, 1GB 4
tlb_flushall_shift: 6
Freeing SMP alternatives memory: 16K (ffffffff81992000 - ffffffff81996000)
ExtINT not setup in hardware but reported by MP table
..TIMER: vector=0x30 apic1=0 pin1=2 apic2=0 pin2=0
smpboot: CPU0: Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz (fam: 06, model: 46, stepping: 01)
Performance Events: unsupported p6 CPU model 70 no PMU driver, software events only.
x86: Booted up 1 node, 1 CPUs
smpboot: Total of 1 processors activated (4390.71 BogoMIPS)
NET: Registered protocol family 16
cpuidle: using governor ladder
cpuidle: using governor menu
PCI: Using configuration type 1 for base access
ACPI: Interpreter disabled.
vgaarb: loaded
SCSI subsystem initialized
usbcore: registered new interface driver usbfs
usbcore: registered new interface driver hub
usbcore: registered new device driver usb
Linux video capture interface: v2.00
PCI: Probing PCI hardware
PCI host bridge to bus 0000:00
pci_bus 0000:00: root bus resource [io  0x0000-0xffff]
pci_bus 0000:00: root bus resource [mem 0x00000000-0x7fffffffff]
pci_bus 0000:00: No busn resource found for root bus, will use [bus 00-ff]
pci 0000:00:00.0: ignoring class 0x060000 (doesn't match header type 01)
pci 0000:00:00.0: bridge configuration invalid ([bus 00-00]), reconfiguring
pci 0000:00:00.0: PCI bridge to [bus 01-ff]
Switched to clocksource refined-jiffies
pnp: PnP ACPI: disabled
pci 0000:00:1f.0: BAR 6: assigned [mem 0x40000000-0x400007ff pref]
pci 0000:00:00.0: not setting up bridge for bus 0000:01
NET: Registered protocol family 2
TCP established hash table entries: 8192 (order: 4, 65536 bytes)
TCP bind hash table entries: 8192 (order: 5, 131072 bytes)
TCP: Hash tables configured (established 8192 bind 8192)
TCP: reno registered
UDP hash table entries: 512 (order: 2, 16384 bytes)
UDP-Lite hash table entries: 512 (order: 2, 16384 bytes)
NET: Registered protocol family 1
RPC: Registered named UNIX socket transport module.
RPC: Registered udp transport module.
RPC: Registered tcp transport module.
RPC: Registered tcp NFSv4.1 backchannel transport module.
pci 0000:00:1f.0: Activating ISA DMA hang workarounds
Trying to unpack rootfs image as initramfs...
Freeing initrd memory: 7432K (ffff880001e77000 - ffff8800025b9000)
platform rtc_cmos: registered platform RTC device (no PNP device found)
AVX2 version of gcm_enc/dec engaged.
futex hash table entries: 256 (order: 2, 16384 bytes)
NFS: Registering the id_resolver key type
Key type id_resolver registered
Key type id_legacy registered
nfs4filelayout_init: NFSv4 File Layout Driver Registering...
fuse init (API version 7.23)
msgmni has been set to 1995
NET: Registered protocol family 38
Block layer SCSI generic (bsg) driver version 0.4 loaded (major 252)
io scheduler noop registered
io scheduler deadline registered (default)
pci_hotplug: PCI Hot Plug PCI Core version: 0.5
pciehp: PCI Express Hot Plug Controller Driver version: 0.4
xenfs: not registering filesystem on non-xen platform
Serial: 8250/16550 driver, 4 ports, IRQ sharing disabled
serial8250: ttyS0 at I/O 0x3f8 (irq = 4, base_baud = 115200) is a 16550A
serial8250: ttyS1 at I/O 0x2f8 (irq = 3, base_baud = 115200) is a 16550A
Non-volatile memory driver v1.3
Hangcheck: starting hangcheck timer 0.9.1 (tick is 180 seconds, margin is 60 seconds).
Hangcheck: Using getrawmonotonic().
brd: module loaded
mtip32xx Version 1.3.1
Error creating debugfs parent
zram: Created 1 device(s) ...
VMware PVSCSI driver - version 1.0.5.0-k
scsi0 : pata_legacy
ata1: PATA max PIO4 cmd 0x1f0 ctl 0x3f6 irq 14
scsi1 : pata_legacy
ata2: PATA max PIO4 cmd 0x170 ctl 0x376 irq 15
libphy: Fixed MDIO Bus: probed
tun: Universal TUN/TAP device driver, 1.6
tun: (C) 1999-2004 Max Krasnyansky <maxk@qualcomm.com>
PPP generic driver version 2.4.2
PPP Deflate Compression module registered
NET: Registered protocol family 24
VFIO - User Level meta-driver version: 0.3
ehci_hcd: USB 2.0 'Enhanced' Host Controller (EHCI) Driver
ehci-pci: EHCI PCI platform driver
ohci_hcd: USB 1.1 'Open' Host Controller (OHCI) Driver
ohci-pci: OHCI PCI platform driver
uhci_hcd: USB Universal Host Controller Interface driver
usbcore: registered new interface driver uas
usbcore: registered new interface driver usb-storage
usbcore: registered new interface driver ums-alauda
usbcore: registered new interface driver ums-cypress
usbcore: registered new interface driver ums-datafab
usbcore: registered new interface driver ums_eneub6250
usbcore: registered new interface driver ums-freecom
usbcore: registered new interface driver ums-isd200
usbcore: registered new interface driver ums-jumpshot
usbcore: registered new interface driver ums-karma
usbcore: registered new interface driver ums-onetouch
usbcore: registered new interface driver ums-sddr09
usbcore: registered new interface driver ums-sddr55
usbcore: registered new interface driver ums-usbat
i8042: PNP: No PS/2 controller found. Probing ports directly.
i8042: Can't read CTR while initializing i8042
i8042: probe of i8042 failed with error -5
mousedev: PS/2 mouse device common for all mice
usbcore: registered new interface driver appletouch
usbcore: registered new interface driver bcm5974
usbcore: registered new interface driver synaptics_usb
rtc_cmos rtc_cmos: rtc core: registered rtc_cmos as rtc0
rtc_cmos rtc_cmos: alarms up to one day, 114 bytes nvram
softdog: Software Watchdog Timer: 0.08 initialized. soft_noboot=0 soft_margin=60 sec soft_panic=0 (nowayout=0)
ledtrig-cpu: registered to indicate activity on CPUs
hidraw: raw HID events driver (C) Jiri Kosina
usbcore: registered new interface driver usbhid
usbhid: USB HID core driver
AMD IOMMUv2 driver by Joerg Roedel <joerg.roedel@amd.com>
AMD IOMMUv2 functionality not available on this system
Netfilter messages via NETLINK v0.30.
nfnl_acct: registering with nfnetlink.
ipip: IPv4 over IPv4 tunneling driver
IPv4 over IPSec tunneling driver
ip_tables: (C) 2000-2006 Netfilter Core Team
TCP: cubic registered
Initializing XFRM netlink socket
NET: Registered protocol family 17
NET: Registered protocol family 15
Key type dns_resolver registered
registered taskstats version 1
rtc_cmos rtc_cmos: setting system clock to 2015-06-14 12:31:54 UTC (1434285114)
Freeing unused kernel memory: 928K (ffffffff818aa000 - ffffffff81992000)
Write protecting the kernel read-only data: 8192k
Freeing unused kernel memory: 1224K (ffff8800014ce000 - ffff880001600000)
Freeing unused kernel memory: 720K (ffff88000174c000 - ffff880001800000)
Booting Core 6.3
Running Linux Kernel 3.16.6-tinycore64.
Checking boot options... Done.
Starting udev daemon for hotplug support...microcode: CPU0 sig=0x40661, pf=0x1, revision=0x0
microcode: Microcode Update Driver: v2.00 <tigran@aivazian.fsnet.co.uk>, Peter Oruba
input: PC Speaker as /devices/platform/pcspkr/input/input0
 Done.
loop: module loaded
zram0: detected capacity change from 0 to 254689280
random: mkswap urandom read with 2 bits of entropy available
Adding 248716k swap on /dev/zram0.  Priority:-1 extents:1 across:248716k SSFS
Scanning hard disk partitions to create /etc/fstab
Setting Language to C Done.
squashfs: version 4.0 (2009/01/31) Phillip Lougher
Possible swap partition(s) enabled.
Loading extensions... Done.
Setting keymap to us Done.
Setting hostname to box Done.

 (?-
 //\   Core is distributed with ABSOLUTELY NO WARRANTY.
 v_/_           www.tinycorelinux.com

login[314]: root login on 'ttyS0'
 (?-
 //\   Core is distributed with ABSOLUTELY NO WARRANTY.
 v_/_           www.tinycorelinux.com

tc@box:~$ Switched to clocksource tsc
```

シャットダウンは普通に `halt` コマンドを実行するだけである。

```bash
tc@box:~$ sudo halt
tc@box:~$
Syncing all filesystems.
Disabling swap space.
Killing  all processes.
Terminating  all processes.
Unmounting all filesystems.
Shutdown in progress.

The system is going down NOW!
Sent SIGTERM to all processes
Sent SIGKILL to all processes
Requesting system halt
reboot: System halted
```

### boot2docker

#### イメージの取得

GitHub のレポジトリを取得して `make` するとイメージが取得される。また、共有フォルダとして `/Users` を公開するために、NFS の設定も行われる。

```bash
$ git clone https://github.com/ailispaw/boot2docker-xhyve
$ cd boot2docker-xhyve
$ make
curl -OL https://github.com/boot2docker/boot2docker/releases/download/v1.6.2/boot2docker.iso
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   395    0   395    0     0    471      0 --:--:-- --:--:-- --:--:--   471
100 25.0M  100 25.0M    0     0  1868k      0  0:00:13  0:00:13 --:--:-- 4246k
hdiutil mount boot2docker.iso
/dev/disk3                                              /Volumes/Boot2Docker-v1.6
cp /Volumes/Boot2Docker-v1.6/boot/initrd.img .
hdiutil unmount /Volumes/Boot2Docker-v1.6
"/Volumes/Boot2Docker-v1.6" unmounted successfully.
hdiutil mount boot2docker.iso
/dev/disk3                                              /Volumes/Boot2Docker-v1.6
cp /Volumes/Boot2Docker-v1.6/boot/vmlinuz64 .
hdiutil unmount /Volumes/Boot2Docker-v1.6
"/Volumes/Boot2Docker-v1.6" unmounted successfully.
curl -OL https://github.com/ailispaw/boot2docker-xhyve/releases/download/v0.2.0/boot2docker-data.tar.gz
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   400    0   400    0     0    499      0 --:--:-- --:--:-- --:--:--   499
100 14.9M  100 14.9M    0     0  1172k      0  0:00:13  0:00:13 --:--:-- 1791k
tar zxvf boot2docker-data.tar.gz
x boot2docker-data.img
Password:
/Users -network 192.168.64.0 -mask 255.255.255.0 -alldirs -mapall=501:20
sudo nfsd restart
The nfsd service does not appear to be running.
Starting the nfsd service
```

#### 起動

```bash
$ sudo ./xhyve-run.sh
Password:

Core Linux
boot2docker login:
```

#### ログイン

`docker` ユーザーでログインできる。

```bash
boot2docker login: docker
                        ##         .
                  ## ## ##        ==
               ## ## ## ## ##    ===
           /"""""""""""""""""\___/ ===
      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~~ ~ /  ===- ~~~
           \______ o           __/
             \    \         __/
              \____\_______/
 _                 _   ____     _            _
| |__   ___   ___ | |_|___ \ __| | ___   ___| | _____ _ __
| '_ \ / _ \ / _ \| __| __) / _` |/ _ \ / __| |/ / _ \ '__|
| |_) | (_) | (_) | |_ / __/ (_| | (_) | (__|   <  __/ |
|_.__/ \___/ \___/ \__|_____\__,_|\___/ \___|_|\_\___|_|
Boot2Docker version 1.6.2, build master : 4534e65 - Wed May 13 21:24:28 UTC 2015
Docker version 1.6.2, build 7c8fca2
docker@boot2docker:~$
```

あとは普通に Docker を使えばよい。

```bash
docker@boot2docker:~$ docker run -i -t ubuntu /bin/bash
Unable to find image 'ubuntu:latest' locally
latest: Pulling from ubuntu

428b411c28f0: Pull complete
435050075b3f: Pull complete
9fd3c8c9af32: Pull complete
6d4946999d4f: Already exists
ubuntu:latest: The image you are pulling has been verified. Important: image verification is a tech preview feature and should not be relied on to provide security.

Digest: sha256:45e42b43f2ff4850dcf52960ee89c21cda79ec657302d36faaaa07d880215dd9
Status: Downloaded newer image for ubuntu:latest
root@1b6093670036:/# uname -a
Linux 1b6093670036 4.0.3-boot2docker #1 SMP Wed May 13 20:54:49 UTC 2015 x86_64 x86_64 x86_64 GNU/Linux
root@1b6093670036:/# cat /etc/lsb-release
DISTRIB_ID=Ubuntu
DISTRIB_RELEASE=14.04
DISTRIB_CODENAME=trusty
DISTRIB_DESCRIPTION="Ubuntu 14.04.2 LTS"
root@1b6093670036:/# exit
exit
docker@boot2docker:~$ docker ps -a
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS                     PORTS               NAMES
1b6093670036        ubuntu:latest       "/bin/bash"         2 minutes ago       Exited (0) 9 seconds ago                       dreamy_nobel
```

## 最後に

xhyve は始まったばかりのプロジェクトであるが、早速 CoreOS や boot2docker を起動するためのスクリプトを公開されているので、Docker を動かすための環境としてはベストと考えている。[Docker Machine](https://docs.docker.com/machine/) のドライバーとして xhyve をサポートする動きもあるので、この動きにも注目している。

{{< hatenablog-parts url="https://github.com/docker/machine/pull/1358" >}}

xhyve が安定化して、Docker Machine のドライバーとしてサポートされた場合は、[Kitematic](https://kitematic.com) も VirtualBox ではなく xhyve を使うようになって欲しいと思っている。
