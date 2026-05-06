---
date: 2015-01-26 07:57:00 +0900
title: Vagrant で Riak クラスターを構築するために vagrant-riak-cluster というものをつくってみた
tags:
  - vagrant
  - riak
images:
  - blog/2015/01/26/01/20150530204004.png
---

Vagrant で Riak クラスターを構築するために [vagrant-riak-cluster](https://github.com/holidayworking/vagrant-riak-cluster) というものを作ってみた。

## 使い方

使い方は [READE.md](https://github.com/holidayworking/vagrant-riak-cluster/blob/master/README.md) にあるとおりで、デフォルトでは 5 ノード作成されるようにしてある。作成するノードは環境変数 `NODES` で定義できるようにしてあるので、3 ノード作成したい場合は次のようにすればよい。

```bash
$ NODES=3 vagrant up
```

## Riak クラスターの構築

`vagrant up` 完了時には各ノードに Riak がインストールされた状態となるので、クラスターを構築するのは次の手順が必要になる。

1. join
2. plan
3. commit

### join

クラスターにノードを追加するために、下記を実行する。

```bash
$ for node in riak{2,3,4,5}; do; vagrant ssh $node -c "sudo riak-admin cluster join riak@192.168.33.11"; done;
Success: staged join request for 'riak@192.168.33.12' to 'riak@192.168.33.11'
Connection to 127.0.0.1 closed.
Success: staged join request for 'riak@192.168.33.13' to 'riak@192.168.33.11'
Connection to 127.0.0.1 closed.
Success: staged join request for 'riak@192.168.33.14' to 'riak@192.168.33.11'
Connection to 127.0.0.1 closed.
Success: staged join request for 'riak@192.168.33.15' to 'riak@192.168.33.11'
Connection to 127.0.0.1 closed.
```

### plan

ノード追加後のクラスターの状態を計画させるために、下記を実行する。

```bash
$ vagrant ssh riak1
[vagrant@riak1 ~]$ sudo riak-admin cluster plan
=============================== Staged Changes ================================
Action         Details(s)
-------------------------------------------------------------------------------
join           'riak@192.168.33.12'
join           'riak@192.168.33.13'
join           'riak@192.168.33.14'
join           'riak@192.168.33.15'
-------------------------------------------------------------------------------


NOTE: Applying these changes will result in 1 cluster transition

###############################################################################
                         After cluster transition 1/1
###############################################################################

================================= Membership ==================================
Status     Ring    Pending    Node
-------------------------------------------------------------------------------
valid     100.0%     20.3%    'riak@192.168.33.11'
valid       0.0%     20.3%    'riak@192.168.33.12'
valid       0.0%     20.3%    'riak@192.168.33.13'
valid       0.0%     20.3%    'riak@192.168.33.14'
valid       0.0%     18.8%    'riak@192.168.33.15'
-------------------------------------------------------------------------------
Valid:5 / Leaving:0 / Exiting:0 / Joining:0 / Down:0

Transfers resulting from cluster changes: 51
  13 transfers from 'riak@192.168.33.11' to 'riak@192.168.33.13'
  13 transfers from 'riak@192.168.33.11' to 'riak@192.168.33.12'
  12 transfers from 'riak@192.168.33.11' to 'riak@192.168.33.15'
  13 transfers from 'riak@192.168.33.11' to 'riak@192.168.33.14'
```

### commit

計画したクラスターの状態を反映させるために、下記を実行する。

```bash
[vagrant@riak1 ~]$ sudo riak-admin cluster commit
Cluster changes committed
```

クラスターの状態は `member-status` で確認できる。

```bash
[vagrant@riak1 ~]$ sudo riak-admin member-status
================================= Membership ==================================
Status     Ring    Pending    Node
-------------------------------------------------------------------------------
valid      20.3%      --      'riak@192.168.33.11'
valid      20.3%      --      'riak@192.168.33.12'
valid      20.3%      --      'riak@192.168.33.13'
valid      20.3%      --      'riak@192.168.33.14'
valid      18.8%      --      'riak@192.168.33.15'
-------------------------------------------------------------------------------
Valid:5 / Leaving:0 / Exiting:0 / Joining:0 / Down:0
```

`Pending` が `--` となっていれば、クラスターの構築は完了である。

## Riak Control

[Riak Control](http://docs.basho.com/riak/latest/ops/advanced/riak-control/) を有効にしてあるので、ブラウザで `http://192.168.33.11:8098/admin` にアクセスすると、次のような画面を確認できる。

{{< screenshot src="20150530204004.png" >}}
