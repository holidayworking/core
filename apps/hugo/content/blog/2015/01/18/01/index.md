---
date: 2015-01-18 17:01:00 +0900
title: "Riak Ruby Client における MapReduce の問題点と対応方法 #0"
tags:
  - ruby
  - riak
  - mapreduce
---

[Riak Ruby Client](https://github.com/basho/riak-ruby-client) で MapReduce を実行しようとしたところ、次の問題点を見つけたので対応方法を書いておく。

- Secondary Indexes でバケットタイプを指定できない
- Riak Search（Yokozuna）を使うことができない

## Secondary Indexes でバケットタイプを指定することができない

Secondary Indexes の検索結果を MapReduce の入力とするには [Riak::MapReduce\#index](https://github.com/basho/riak-ruby-client/blob/2.0-stable/lib/riak/map_reduce.rb#L122) を使うことになる。しかし、このメソッドの引数としてバケットタイプを指定できない。

そもそも、バケットタイプを指定する方法を調べてみたら、次のように `inputs.bucket` で `[bucket_type, bucket_name]` のようにすればできることが分かった。

```bash
curl -X POST http://localhost:8098/mapred \
  -H "Content-Type: application/json" \
  -d @-<<EOF
{
  "inputs": {
    "bucket": ["yokozuna", "access_log"],
    "index": "time_int",
    "start": 1421506800,
    "end": 1421593199
  },
  "query": [
    {
      "map": {
        "language": "javascript",
        "source": "function(value) { return [1]; }"
      }
    },
    {
      "reduce": {
        "language": "javascript",
        "source": "Riak.reduceSum",
        "keep": true
      }
    }
  ]
}
EOF
```

これを Riak Ruby Client で実行する場合は、次のようになる。

```ruby
map_reduce = Riak::MapReduce.new(client)
map_reduce.inputs = {
  bucket: ["yokozuna", "access_log"],
  index:  'time_int',
  start:  1421506800,
  end:    1421593199
}
map_reduce.map('function(value) { return [1]; }').reduce('Riak.reduceSum', keep: true).run
```

## Riak Search （Yokozuna） を使うことができない

Riak Search（Yokozuna）の検索結果を MapReduce の入力とするには [Riak::MapReduce\#search](https://github.com/basho/riak-ruby-client/blob/2.0-stable/lib/riak/map_reduce.rb#L109) を使うことになると思っていた。しかし、この実装を確認してみると、`module` が `riak_search` となっており Riak Search（Yokozuna）には対応していないことが分かった。

```ruby
def search(bucket, query)
  bucket = bucket.name if bucket.respond_to?(:name)
  @inputs = {:module => "riak_search", :function => "mapred_search", :arg => [bucket, query]}
  self
end
```

Riak Search（Yokozuna）を使う場合は次のように `module` は `yokozuna` を指定しなければならない。

```bash
curl -X POST http://localhost:8098/mapred \
  -H "Content-Type: application/json" \
  -d @-<<EOF
{
  "inputs": {
    "module": "yokozuna",
    "function":"mapred_search",
    "arg": ["access_log", "*:*"]
  },
  "query": [
    {
      "map": {
        "language": "javascript",
        "source": "function(value) { return [1]; }"
      }
    },
    {
      "reduce": {
        "language": "javascript",
        "source": "Riak.reduceSum",
        "keep": true
      }
    }
  ]
}
EOF
```

そのため、Riak Ruby Client で実行する場合は、次のようにしてやる必要がある。

```ruby
map_reduce = Riak::MapReduce.new(client)
map_reduce.inputs = { module: 'yokozuna', function: 'mapred_search', arg: ['access_log', '*:*'] }
map_reduce.map('function(value) { return [1]; }').reduce('Riak.reduceSum', keep: true).run
```
