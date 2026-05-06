---
date: 2015-06-02 00:19:22 +0900
title: Hyper で Nginx を実行してみる
tags:
  - linux
  - hyper
images:
  - blog/2015/06/02/01/20150602001212.png
---

[以前のエントリー](http://holidayworking.org/blog/2015/06/01/01/) では `run` コマンドで VM インスタンスを作成・起動してみた。

[Pod](https://docs.hyper.sh/get_started/pod.html) でも VM インスタンスの作成・起動ができるようなので、今回は Pod で VM インスタンスを作成して Nginx を実行してみた。

## Podfile の作成

次のような内容で定義してみた。

```javascript
{
  "name": "nginx",
  "containers" : [{
    "image": "nginx:latest",
    "ports": [{
      "containerPort": 80,
      "hostPort": 8080
    }]
  }],
  "resource": {
    "vcpu": 1,
    "memory": 128
  }
}
```

Podfile の書き方については [Podfile | About Hyper](ttps://docs.hyper.sh/reference/podfile.html) で説明されている。

今回は Docker イメージとして [nginx](https://registry.hub.docker.com/_/nginx/) を選択して、ホスト 8080 ポートを VM インスタンスの 80 ポートへフォワーディングさせるようにした。また、仮想 CPU を 1 コア、メモリを 128MB に設定した。

## VM のインスタンスの作成

上記の Podfile を `nginx.pod` として保存した場合に、次のように実行すると VM インスタンスが作成される。

```bash
$ sudo hyper create nginx.pod
Pod ID is pod-cgZKrBZKUl
```

正常に作成されると Pod ID が表示されるようだ。

また、`list` コマンドでも確認できる。

```bash
$ sudo hyper list
         POD ID                      POD Name             VM name    Status
 pod-cgZKrBZKUl                    f1nq5fhp0a                       pending
```

## VM インスタンスの起動

Pod ID を `start` コマンドの引数として渡すと、VM インスタンスが起動される。

```bash
$ sudo hyper start pod-cgZKrBZKUl
Successful to start the Pod(pod-cgZKrBZKUl)
```

`list` コマンドで確認すると、ステータスが `running` になっていることが分かる。

```bash
$ sudo hyper list
         POD ID                      POD Name             VM name    Status
 pod-cgZKrBZKUl                    f1nq5fhp0a       vm-YupnKWgkcB   running
```

## 動作確認

これで Nginx が起動しているので、Hyper を実行している環境の 8080 ポートにアクセスしてみたところ…。

{{< screenshot src="20150602001212.png" >}}

「Gateway Timeout: can't connect to remote host」とエラーが表示された…。

いろいろ調べたところ、現時点のパージョンではポートフォワーディングに対応していないためであることが分かった。

> @henrysher the port-map is on the way, will come soon. Thanks!
>
> [no running container in \`docker ps\` after hyper started the pod · Issue \#11 · hyperhq/hyperd · GitHub](https://github.com/hyperhq/hyperd/issues/11#issuecomment-107340135)

ポートフォワーディングについて対応中で近々リリースされる模様なので、対応したバージョンがリリースされたら、再度試してみることにする。
