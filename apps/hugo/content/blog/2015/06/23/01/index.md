---
date: 2015-06-23 08:00:00 +0900
title: Riak Erlang MapReduce でハマってしまった
tags:
  - riak
  - mapreduce
  - erlang
---

Riak の MapReduce は Erlang と JavaScript で書くことができるが、JavaScript のサポートは将来的に廃止されることが決まっている。

> JavaScript MapReduce is deprecated; we have expanded our Erlang MapReduce documentation to assist with the transition.
>
> [:title] > [riak/releasenotes/riak-2\.0\.md at develop · basho/riak · GitHub](https://github.com/basho/riak/blob/develop/releasenotes/riak-2.0.md#deprecation-notices)

MapReduce を書くときは JavaScript で書いていたのだが、将来的にサポートされなくことを考えると Erlang でも書けるようになっておいたほうがよいので、簡単な処理から Erlang に移植しようと考えてみた。

試しに次の MapReduce を実行してみることにした。

```ruby
Riak::MapReduce.new(client).
  index(bucket, 'time_int', 1434812400..1434898799).
  map('fun(_, _, _) -> [1] end.', language: 'erlang').
  reduce(['riak_kv_mapreduce', 'reduce_sum'], keep: true).
  run
```

そうしたら、次のようなエラーが発生した。

```text
Riak::ProtobuffsErrorResponse: Expected success from Riak but received 0. {"phase":0,"error":"[worker_startup_failed]","input":"{{{&lt;&lt;\"yokozuna\"&gt;&gt;,&lt;&lt;\"action_logs\"&gt;&gt;},&lt;&lt;\"2015-06-20-274335d7-e277-458c-850f-a8bd813472c8\"&gt;&gt;},undefined}","type":"result","stack":"[]"}
```

[Stack Overflow](https://stackoverflow.com/questions/28737888/how-to-send-erlang-functions-source-to-riak-mapreduce-via-http/28745848)で似たような質問をしている方がいて、このような書き方をする場合は`advanced.config`に下記を記述する必要があるとのこと。

```text
[
    {riak_kv, [
        {allow_strfun, true}
    ]}
].
```

セキュリティリスクがあるという回答をしている方もいたが、今回は勉強も兼ねているので`advanced.config`を編集することで対処することにした。

そうしたら、期待とおりの結果を得ることができた。

```ruby
Riak::MapReduce.new(client).
  index(bucket, 'time_int', 1434812400..1434898799).
  map('fun(_, _, _) -> [1] end.', language: 'erlang').
  reduce(['riak_kv_mapreduce', 'reduce_sum'], keep: true).
  run
=> [15]
```

本来は Erlang モジュールを作成して、そのモジュールの関数を呼び出すようにするのがベストだと思われる。
