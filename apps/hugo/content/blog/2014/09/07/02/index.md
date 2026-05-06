---
date: 2014-09-07 15:10:00 +0900
title: "Riak Ruby Client で Riak Search (Yokozuna) を試してみた #1"
tags:
  - ruby
  - riak
---

Riak 2.0 で追加された Data Types で登録されたデータに対して Riak Search（Yokozuna）を試してみた。

バケットとインデックスの紐付けをどうするか分からなかったけど、`Riak::Client#set_bucket_props` でバケットタイプを指定するだけで良かった模様。

```ruby
$ rails c
Loading development environment (Rails 4.1.5)
[1] pry(main)> client = $riak
=> #<Riak::Client [#<Node 127.0.0.1:8087>]>
[2] pry(main)> bucket = client.bucket 'artists'
=> #<Riak::Bucket {artists}>
[3] pry(main)> client.create_search_index 'artists'
=> true
[4] pry(main)> client.set_bucket_props bucket, { search_index: 'artists' }, Riak::Crdt::DEFAULT_BUCKET_TYPES[:map]
=> true
[5] pry(main)> map = Riak::Crdt::Map.new bucket, nil
=> #<Riak::Crdt::Map:0x007f198bee0448
 @bucket=#<Riak::Bucket {artists}>,
 @bucket_type="maps",
 @counters=#<Riak::Crdt::TypedCollection:0x007f198bee02b8 @contents={}, @parent=#<Riak::Crdt::Map:0x007f198bee0448 ...>, @type=Riak::Crdt::InnerCounter>,
 @dirty=true,
 @flags=#<Riak::Crdt::TypedCollection:0x007f198bee00d8 @contents={}, @parent=#<Riak::Crdt::Map:0x007f198bee0448 ...>, @type=Riak::Crdt::InnerFlag>,
 @key=nil,
 @maps=#<Riak::Crdt::TypedCollection:0x007f198beeff60 @contents={}, @parent=#<Riak::Crdt::Map:0x007f198bee0448 ...>, @type=Riak::Crdt::InnerMap>,
 @options={},
 @registers=#<Riak::Crdt::TypedCollection:0x007f198beefe48 @contents={}, @parent=#<Riak::Crdt::Map:0x007f198bee0448 ...>, @type=Riak::Crdt::InnerRegister>,
 @sets=#<Riak::Crdt::TypedCollection:0x007f198beefcb8 @contents={}, @parent=#<Riak::Crdt::Map:0x007f198bee0448 ...>, @type=Riak::Crdt::InnerSet>>
[6] pry(main)> map.registers['name'] = 'T-SQUARE'
=> "T-SQUARE"
[7] pry(main)> map.registers['description'] = 'T-SQUARE（ティー・スクェア）は、日本のインストゥメンタルバンド。1988年までは、THE SQUARE（ザ・スクェア）名義で活動していた。通称は スクェア。'
=> "T-SQUARE\xEF\xBC\x88\xE3\x83\x86\xE3\x82\xA3\xE3\x83\xBC\xE3\x83\xBB\xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xEF\xBC\x89\xE3\x81\xAF\xE3\x80\x81\xE6\x97\xA5\xE6\x9C\xAC\xE3\x81\xAE\xE3\x82\xA4\xE3\x83\xB3\xE3\x82\xB9\xE3\x83\x88\xE3\x82\xA5\xE3\x83\xA1\xE3\x83\xB3\xE3\x82\xBF\xE3\x83\xAB\xE3\x83\x90\xE3\x83\xB3\xE3\x83\x89\xE3\x80\x821988\xE5\xB9\xB4\xE3\x81\xBE\xE3\x81\xA7\xE3\x81\xAF\xE3\x80\x81THE SQUARE\xEF\xBC\x88\xE3\x82\xB6\xE3\x83\xBB\xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xEF\xBC\x89\xE5\x90\x8D\xE7\xBE\xA9\xE3\x81\xA7\xE6\xB4\xBB\xE5\x8B\x95\xE3\x81\x97\xE3\x81\xA6\xE3\x81\x84\xE3\x81\x9F\xE3\x80\x82\xE9\x80\x9A\xE7\xA7\xB0\xE3\x81\xAF\xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xE3\x80\x82"
[8] pry(main)> client.search('artists', '*:*')
=> {"max_score"=>1.0,
 "num_found"=>1,
 "docs"=>
  [{"score"=>"1.00000000000000000000e+00",
    "_yz_rb"=>"artists",
    "_yz_rt"=>"maps",
    "_yz_rk"=>"AJWDBr8V5PNGrDjx6tNXhycbToI",
    "_yz_id"=>"1*maps*artists*AJWDBr8V5PNGrDjx6tNXhycbToI*54",
    "name_register"=>"T-SQUARE",
    "description_register"=>"T-SQUARE（ティー・スクェア）は、日本のインストゥメンタルバンド。1988年までは、THE SQUARE（ザ・スクェア）名義で活動していた。通称はスクェア。"}]}
```

上手くいっているように思えるけど、なぜか完全一致検索しかできない…。

```ruby
[9] pry(main)> client.search('artists', 'name_register:T-SQUARE')
=> {"max_score"=>0.712317943572998,
 "num_found"=>1,
 "docs"=>
  [{"score"=>"7.12317940000000038303e-01",
    "_yz_rb"=>"artists",
    "_yz_rt"=>"maps",
    "_yz_rk"=>"AJWDBr8V5PNGrDjx6tNXhycbToI",
    "_yz_id"=>"1*maps*artists*AJWDBr8V5PNGrDjx6tNXhycbToI*54",
    "name_register"=>"T-SQUARE",
    "description_register"=>"T-SQUARE（ティー・スクェア）は、日本のインストゥメンタルバンド。1988年までは、THE SQUARE（ザ・スクェア）名義で活動していた。通称はスクェア。"}]}
[10] pry(main)> client.search('artists', 'name_register:SQUARE')
=> {"max_score"=>0.0, "num_found"=>0, "docs"=>[]}
[11] pry(main)> client.search('artists', '*:日本')
=> {"max_score"=>0.0, "num_found"=>0, "docs"=>[]}
```
