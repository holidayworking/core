---
date: 2015-05-31 15:45:25 +0900
title: Riak Ruby Client 2.2.0 がリリースされていた
tags:
  - ruby
  - riak
---

Riak Ruby Client の最新バージョンとなる 2.2.0 がリリースされていた。

リリースノートによると、新機能は次のとおりである。

> - Object-oriented Riak Search (Yokozuna) API.
> - Object-oriented Bucket Properties API.
> - Bucket type properties are readable.
> - Bucket-typed buckets without properties expose properties of bucket type.
> - An interface to get a preflist for Riak KV objects has been added.
>
> [https://github.com/basho/riak-ruby-client/blob/master/RELEASE_NOTES.md:title]

個人的に注目したのは次の点である。

- バケットタイプの指定方法が便利になった
- Riak Search（Yokozuna）API がいい感じになった

## バケットタイプの指定方法が便利になった

これまではデータの保存や取得時にバケットタイプを指定する必要があった。

```ruby
coffees = client.bucket('coffees')

chapadao = coffees.new('chapadao')
chapadao.data = 'Chapadao de Ferro'
chapadao.store(type: 'beverages')
```

2.2.0 では `Riak::BucketType` クラスと `Riak::BucketTyped::Bucket` クラスが追加されたため、次のように指定できるようになった。

```ruby
beverages = client.bucket_type('beverages')
coffees = beverages.bucket('coffees')

chapadao = coffees.new('chapadao')
chapadao.data = 'Chapadao de Ferro'
chapadao.store
```

データを保存や取得するたびにバケットタイプを指定するのは面倒に感じていたので、このように指定できるようになったのはうれしい。

## Riak Search （Yokozuna） API がいい感じになった

Riak Search（Yokozuna）API もこれまでのバージョンと比較していい感じになっている。また、検索結果からデータタイプのオブジェクトを取得したい場合は、次のようにする必要があった。

```ruby
client.search('artists', '*:*')['docs'].map { |doc| Riak::Crdt::Map.new(bucket, doc['_yz_rk']) }
results.first
=> #<Riak::Crdt::Map
 bucket_type=maps,
 bucket=artists,
 key=MsKeaqM5C3AeXfKSghymB77X5VC,
 counters=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerCounter, parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>, contents={}>,
 flags=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerFlag, parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>, contents={}>,
 maps=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerMap, parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>, contents={}>,
 registers=#<Riak::Crdt::TypedCollection
  contains=Riak::Crdt::InnerRegister,
  parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>,
  contents={"description"=>
    "T-SQUARE\xEF\xBC\x88\xE3\x83\x86\xE3\x82\xA3\xE3\x83\xBC\xE3\x83\xBB\xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xEF\xBC\x89\xE3\x81\xAF\xE3\x80\x81\xE6\x97\xA5\xE6\x9C\xAC\xE3\x81\xAE\xE3\x82\xA4\xE3\x83\xB3\xE3\x82\xB9\xE3\x83\x88\xE3\x82\xA5\xE3\x83\xA1\xE3\x83\xB3\xE3\x82\xBF\xE3\x83\xAB\xE3\x83\x90\xE3\x83\xB3\xE3\x83\x89\xE3\x80\x821988\xE5\xB9\xB4\xE3\x81\xBE\xE3\x81\xA7\xE3\x81\xAF\xE3\x80\x81THE SQUARE\xEF\xBC\x88\xE3\x82\xB6\xE3\x83\xBB\xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xEF\xBC\x89\xE5\x90\x8D\xE7\xBE\xA9\xE3\x81\xA7\xE6\xB4\xBB\xE5\x8B\x95\xE3\x81\x97\xE3\x81\xA6\xE3\x81\x84\xE3\x81\x9F\xE3\x80\x82\xE9\x80\x9A\xE7\xA7\xB0\xE3\x81\xAF \xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xE3\x80\x82",
   "name"=>"T-SQUARE"}>,
 sets=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerSet, parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>, contents={}>>
```

2.2.0 ではデータタイプのオブジェクトを透過的に取得できるようになっている。

```ruby
query = Riak::Search::Query.new(client, index, '*:*')
results = query.results

results.first
=> #<Riak::Crdt::Map
 bucket_type=maps,
 bucket=artists,
 key=MsKeaqM5C3AeXfKSghymB77X5VC,
 counters=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerCounter, parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>, contents={}>,
 flags=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerFlag, parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>, contents={}>,
 maps=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerMap, parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>, contents={}>,
 registers=#<Riak::Crdt::TypedCollection
  contains=Riak::Crdt::InnerRegister,
  parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>,
  contents={"description"=>
    "T-SQUARE\xEF\xBC\x88\xE3\x83\x86\xE3\x82\xA3\xE3\x83\xBC\xE3\x83\xBB\xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xEF\xBC\x89\xE3\x81\xAF\xE3\x80\x81\xE6\x97\xA5\xE6\x9C\xAC\xE3\x81\xAE\xE3\x82\xA4\xE3\x83\xB3\xE3\x82\xB9\xE3\x83\x88\xE3\x82\xA5\xE3\x83\xA1\xE3\x83\xB3\xE3\x82\xBF\xE3\x83\xAB\xE3\x83\x90\xE3\x83\xB3\xE3\x83\x89\xE3\x80\x821988\xE5\xB9\xB4\xE3\x81\xBE\xE3\x81\xA7\xE3\x81\xAF\xE3\x80\x81THE SQUARE\xEF\xBC\x88\xE3\x82\xB6\xE3\x83\xBB\xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xEF\xBC\x89\xE5\x90\x8D\xE7\xBE\xA9\xE3\x81\xA7\xE6\xB4\xBB\xE5\x8B\x95\xE3\x81\x97\xE3\x81\xA6\xE3\x81\x84\xE3\x81\x9F\xE3\x80\x82\xE9\x80\x9A\xE7\xA7\xB0\xE3\x81\xAF \xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xE3\x80\x82",
   "name"=>"T-SQUARE"}>,
 sets=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerSet, parent=#<Riak::Crdt::Map maps/artists/MsKeaqM5C3AeXfKSghymB77X5VC>, contents={}>>
```
