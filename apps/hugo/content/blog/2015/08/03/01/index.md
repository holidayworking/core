---
date: 2015-08-03 08:00:00 +0900
title: Riak MapReduce を Elixir で書いてみる
tags:
  - riak
  - elixir
---

## 前提条件

- CentOS 7.1.1503
- Riak 2.1.1
- Erlang/OTP 18.0
- Elixir v1.0.5

## 事前準備

### Erlang/OTP のインストール

Elixir を動かすためには Erlang/OTP 17 以降のインストールが必要となる。今回は Erlang Solutions レポジトリを追加して、Erlang/OTP 18.0 をインストールする。

```bash
$ wget http://packages.erlang-solutions.com/erlang-solutions-1.0-1.noarch.rpm
$ sudo rpm -Uvh erlang-solutions-1.0-1.noarch.rpm
$ sudo yum install erlang
```

### Elixir のインストール

最新の安定版である v1.0.5 の CentOS 用 RPM が公開されていなかったので、GitHub で公開されているコンパイル済みのアーカイブを使う。

```bash
$ wget https://github.com/elixir-lang/elixir/releases/download/v1.0.5/Precompiled.zip
$ sudo unzip Precompiled.zip -d /opt/elixir
$ export PATH=/opt/elixir/bin:$PATH
```

## Riak MapReduce を書いてみる

今回は指定したバケットのキー一覧を取得する MapReduce を Elixir で実装する場合は、次のようなコードとなる。

```elixir
defmodule MapReduceExample do
  def get_keys(value, _, _) do
    [{:riak_object.bucket(value), :riak_object.key(value)}]
  end
end
```

これを `map_reduce_example.ex` というファイル名で保存してコンパイルする。

```bash
$ elixirc map_reduce_example.ex
```

コンパイルが終わると `Elixir.MapReduceExample.beam` が生成される。このファイルを `/usr/lib64/riak/lib/basho-patches` にコピーして Riak を再起動する。

```bash
$ sudo cp Elixir.MapReduceExample.beam /usr/lib64/riak/lib/basho-patches
$ sudo service riak restart
```

あとは次のように MapReduce を実行する。

```bash
$ curl -X POST localhost:8098/mapred \
  -H 'Content-Type: application/json'   \
  -d '{"inputs":"training","query":[{"map":{"language":"erlang","module":"Elixir.MapReduceExample","function":"get_keys"}}]}'
{"training":"bar","training":"bam","training":"baz","training":"foo"}
```
