---
date: 2015-01-11 17:04:00 +0900
title: Riak Search (Yokozuna) で位置情報検索をしてみた
tags:
  - ruby
  - riak
---

Riak Search（Yokozuna）のバックエンドである Solr は位置情報検索に対応しているので、Riak Search でも位置情報検索ができる。

[HeartRails Express](http://express.heartrails.com)の API で駅の位置情報を取得できるので、検索対象データとして今回は駅情報を使うことにする。

```ruby
#!/usr/bin/env ruby

require 'json'
require 'open-uri'
require 'riak'
require 'uri'

client = Riak::Client.new

bucket = client.bucket('stations')

client.create_search_index('stations')
client.set_bucket_props(bucket, { search_index: 'stations' })

response = open("http://express.heartrails.com/api/json?method=getStations&line=#{URI.encode('JR函館本線')}").read
JSON.parse(response)['response']['station'].each do |station|
  object = bucket.new(station['name'])
  object.data = {
    name_s: station['name'],
    location_p: "#{station['y']},#{station['x']}"
  }
  object.store
end
```

このスクリプトを実行すると`stations`バケットとこのバケットに紐づく`stations`インデックスが作成されて、駅情報が登録される。

あとは、次のようにすれば位置情報検索ができる。

```ruby
$ bundle exec pry
[1] pry(main)> require 'riak'
=> true
[2] pry(main)> client = Riak::Client.new
=> #<Riak::Client [#<Node 127.0.0.1:8087>]>
[3] pry(main)> client.search('stations', '{!geofilt sfield=location_p pt=41.774002,140.726408 d=10}', sort: 'score asc')
=> {"max_score"=>8.04973030090332,
 "num_found"=>3,
 "docs"=>
  [{"score"=>"0.00000000000000000000e+00",
    "_yz_rb"=>"stations",
    "_yz_rt"=>"default",
    "_yz_rk"=>"函館",
    "_yz_id"=>"1*default*stations*函館*7",
    "name_s"=>"函館",
    "location_p"=>"41.774002,140.726408"},
   {"score"=>"3.33613800000000004786e+00",
    "_yz_rb"=>"stations",
    "_yz_rt"=>"default",
    "_yz_rk"=>"五稜郭",
    "_yz_id"=>"1*default*stations*五稜郭*43",
    "name_s"=>"五稜郭",
    "location_p"=>"41.803527,140.733559"},
   {"score"=>"8.04973000000000027399e+00",
    "_yz_rb"=>"stations",
    "_yz_rt"=>"default",
    "_yz_rk"=>"桔梗",
    "_yz_id"=>"1*default*stations*桔梗*28",
    "name_s"=>"桔梗",
    "location_p"=>"41.84635,140.722989"}]}
```

函館駅から 10 キロメートル以内にある駅を検索している。`score`の値は函館駅からの距離のようである。

## 参考

- [GeoSpatial Indexing with Riak Search 2.0 (Yokozuna/Solr) | Christopher Biscardi](http://www.christopherbiscardi.com/2014/02/07/geospatial-indexing-with-riak-search-2-0-yokozunasolr/)
- [Spatial Search - Apache Solr Reference Guide - Apache Software Foundation](https://cwiki.apache.org/confluence/display/solr/Spatial+Search)
