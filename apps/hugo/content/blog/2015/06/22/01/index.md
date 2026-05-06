---
date: 2015-06-22 09:00:00 +0900
title: Riak Ruby Client 2.2.1 のリリース
tags:
  - ruby
  - riak
---

Riak Ruby Client 2.2.1 がリリースされた。

このリリースではバグ修正と試験的な実装が行われている。

<!-- textlint-disable ja-technical-writing/max-comma -->

> Version 2.2.1 is a bugfix release, and includes additional testing of character
> encodings.
>
> Bug fixes:
>
> - Support bucket-typed buckets when creating secondary-index input phases
>   for map-reduce, thanks to Hidekazu Tanaka.
> - Support Riak Search 2 / Yokozuna results as input phases for map-reduce,
>   thanks again to Hidekazu Tanaka.
> - `BucketTyped::Bucket#get_index` now includes the bucket type name in the
>   2i request.
> - `Bucket#==` now performs an encoding-independent comparison on bucket names.
> - `BucketType#==` also does an encoding-independent comparison on type names.
>
> Testing enhancements:
>
> - Non-ASCII UTF-8 strings, and binary strings containing byte 255 are tested
>   with key-value, secondary index, CRDT, and Riak Search interfaces. These
>   findings are available on our documentation site:
>   http://basho.github.io/riak-ruby-client/encoding.html
>
> [riak\-ruby\-client/RELEASE_NOTES\.md at master · basho/riak\-ruby\-client · GitHub](https://github.com/basho/riak-ruby-client/blob/master/RELEASE_NOTES.md#221-release---2015-06-19)

<!-- textlint-enable ja-technical-writing/max-comma-->

MapReduce のバグ修正は僕が対応したもので、下記を MapReduce の入力とする場合の書き方が改善されている。

- バケットタイプが指定されたバケットに対するセカンダリインデックスの検索結果
- Riak Search（Yokozuna）の検索結果

どのように改善されたのかを簡単に説明する。

説明するに当たってデータが必要となるので、次のようなスクリプトでテストデータを作成した。

```ruby
require 'riak'

client = Riak::Client.new(pb_port: 17017)

bucket_type = client.bucket_type('yokozuna')
bucket = bucket_type.bucket('action_logs')

index = Riak::Search::Index.new(client, 'action_logs')
index.create!
client.set_bucket_props(bucket, { search_index: index.name }, bucket_type.name)

[
  { time_tdt: Time.local(2015, 6, 21, 1, 00, 00),  user_code_s: 'user001', item_code_s: 'item001', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 1, 05, 00),  user_code_s: 'user001', item_code_s: 'item002', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 1, 10, 00),  user_code_s: 'user001', item_code_s: 'item003', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 1, 15, 00),  user_code_s: 'user001', item_code_s: 'item004', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 1, 30, 00),  user_code_s: 'user001', item_code_s: 'item001', type_s: 'purchase' },
  { time_tdt: Time.local(2015, 6, 21, 1, 30, 00),  user_code_s: 'user001', item_code_s: 'item002', type_s: 'purchase' },
  { time_tdt: Time.local(2015, 6, 21, 9, 10, 00),  user_code_s: 'user002', item_code_s: 'item001', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 9, 15, 00),  user_code_s: 'user002', item_code_s: 'item002', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 9, 25, 00),  user_code_s: 'user002', item_code_s: 'item003', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 9, 45, 00),  user_code_s: 'user002', item_code_s: 'item004', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 10, 00, 00), user_code_s: 'user002', item_code_s: 'item003', type_s: 'purchase' },
  { time_tdt: Time.local(2015, 6, 21, 10, 00, 00), user_code_s: 'user002', item_code_s: 'item004', type_s: 'purchase' },
  { time_tdt: Time.local(2015, 6, 21, 23, 50, 00), user_code_s: 'user003', item_code_s: 'item005', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 23, 51, 00), user_code_s: 'user003', item_code_s: 'item003', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 21, 23, 55, 00), user_code_s: 'user003', item_code_s: 'item005', type_s: 'purchase' },
  { time_tdt: Time.local(2015, 6, 22, 1, 30, 00),  user_code_s: 'user004', item_code_s: 'item001', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 22, 1, 31, 00),  user_code_s: 'user004', item_code_s: 'item002', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 22, 1, 45, 00),  user_code_s: 'user004', item_code_s: 'item004', type_s: 'view' },
  { time_tdt: Time.local(2015, 6, 22, 1, 45, 00),  user_code_s: 'user004', item_code_s: 'item004', type_s: 'purchase' }
].each do |record|
  time = record[:time_tdt].utc
  object = bucket.new("#{time.to_date}-#{SecureRandom.uuid}")
  object.data = record.merge(time_tdt: time.iso8601)
  object.indexes['time_int'] = [time.to_i]
  object.store
end
```

6 月 21 日の行動履歴ログが何件あるのかを MapReduce で求めることにする。

## バケットタイプが指定されたバケットに対するセカンダリインデックスの検索結果

`Riak::MapReduce#index` がバケットタイプを考慮していなかったため、次のように書く必要があった。

```ruby
map_reduce = Riak::MapReduce.new(client)
map_reduce.inputs = {
  bucket: ["yokozuna", "action_logs"],
  index:  'time_int',
  start:  1434812400,
  end:    1434898799
}
map_reduce.map('function(value) { return [1]; }').reduce('Riak.reduceSum', keep: true).run
=> [15]
```

Riak Ruby Client 2.2.1 では次のように書けるようにした。

```ruby
Riak::MapReduce.new(client).
  index(bucket, 'time_int', 1434812400..1434898799).
  map('function(value) { return [1]; }').
  reduce('Riak.reduceSum', keep: true).
  run
=> [15]
```

`Riak::BucketTyped::Bucket` のオブジェクトが渡された場合に `bucket` を `['yokozuna', 'action_logs']` のように展開するようになっている。`Riak::Bucket` のオブジェクトが渡された場合はこれまでとおり `bucket` は `action_logs` のようになる。

## Riak Search （Yokozuna） の検索結果

`Riak::MapReduce#search` で指定されていたモジュールが `riak_search` であったため、次のように書く必要があった。

```ruby
map_reduce = Riak::MapReduce.new(client)
map_reduce.inputs = { module: 'yokozuna', function: 'mapred_search', arg: ['action_logs', 'time_tdt:[2015-06-20T15:00:00Z TO 2015-06-21T14:59:59Z]'] }
map_reduce.map('function(value) { return [1]; }').reduce('Riak.reduceSum', keep: true).run
=> [15]
```

Riak Ruby Client 2.2.1 では次のように書けるようにした。

```ruby
Riak::MapReduce.new(client).
  search(index, 'time_tdt:[2015-06-20T15:00:00Z TO 2015-06-21T14:59:59Z]').
  map('function(value) { return [1]; }').
  reduce('Riak.reduceSum', keep: true).
  run
=> [15]
```

`Riak::MapReduce#search` で指定するモジュールが `yokozuna` に変更しただけである。また、インデックスを `String` または `Riak::Search::Index` のオブジェクトで指定できるようにもしている。

Yokozuna ではない Riak Search の検索結果を指定することを出来ないようにしてよいのかと不安に思っていたが、この点についてプルリクでは何も指摘されなかった…。
