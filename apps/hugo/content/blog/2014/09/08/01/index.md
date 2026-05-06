---
date: 2014-09-08 00:17:00 +0900
title: "Riak Ruby Client で Riak Search (Yokozuna) を試してみた #2"
tags:
  - ruby
  - riak
---

Riak Search（Yokozuna）のデフォルトスキーマだと Data Types で登録したデータはアナライズされないことが分かったので、次のようにスキーマを変更してみた。

```bash
$ diff -u /usr/lib64/riak/lib/yokozuna-2.0.0-0-geb4919c/priv/default_schema.xml artists_schema.xml
--- /usr/lib64/riak/lib/yokozuna-2.0.0-0-geb4919c/priv/default_schema.xml       2014-08-30 12:57:29.000000000 +0900
+++ artists_schema.xml  2014-09-07 23:57:44.237088018 +0900
@@ -97,6 +97,8 @@
    <field name="counter" type="int"    indexed="true" stored="true" multiValued="false" />
    <field name="set"     type="string" indexed="true" stored="false" multiValued="true" />

+   <field name="description_register" type="text_ja" indexed="true" stored="true" multiValued="true" />
+
    <!-- Riak datatypes embedded fields -->
    <dynamicField name="*_flag"     type="boolean" indexed="true" stored="true" multiValued="false" />
    <dynamicField name="*_counter"  type="int"     indexed="true" stored="true" multiValued="false" />
```

変更したスキーマを登録してインデックスを作成したら、対象のフィールドで全文検索をできることを確認した。

```ruby
$ rails c
Loading development environment (Rails 4.1.5)
[1] pry(main)> client = $riak
=> #<Riak::Client [#<Node 127.0.0.1:8087>]>
[2] pry(main)> bucket = client.bucket 'artists'
=> #<Riak::Bucket {artists}>
[3] pry(main)> client.create_search_schema 'artists_schema', File.read('./artists_schema.xml')
=> true
[4] pry(main)> client.create_search_index 'artists', 'artists_schema'
=> true
[5] pry(main)> client.set_bucket_props bucket, { search_index: 'artists' }, Riak::Crdt::DEFAULT_BUCKET_TYPES[:map]
=> true
[6] pry(main)> map = Riak::Crdt::Map.new bucket, nil
=> #<Riak::Crdt::Map
 bucket_type=maps,
 bucket=artists,
 key=,
 counters=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerCounter, parent=#<Riak::Crdt::Map maps/artists/>, contents={}>,
 flags=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerFlag, parent=#<Riak::Crdt::Map maps/artists/>, contents={}>,
 maps=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerMap, parent=#<Riak::Crdt::Map maps/artists/>, contents={}>,
 registers=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerRegister, parent=#<Riak::Crdt::Map maps/artists/>, contents={}>,
 sets=#<Riak::Crdt::TypedCollection contains=Riak::Crdt::InnerSet, parent=#<Riak::Crdt::Map maps/artists/>, contents={}>>
[7] pry(main)> map.registers['name'] = 'T-SQUARE'
=> "T-SQUARE"
[8] pry(main)> map.registers['description'] = 'T-SQUARE（ティー・スクェア）は、日本のインストゥメンタルバンド。1988年までは、THE SQUARE（ザ・スクェア）名義で活動していた。通称は スクェア。'
=> "T-SQUARE\xEF\xBC\x88\xE3\x83\x86\xE3\x82\xA3\xE3\x83\xBC\xE3\x83\xBB\xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xEF\xBC\x89\xE3\x81\xAF\xE3\x80\x81\xE6\x97\xA5\xE6\x9C\xAC\xE3\x81\xAE\xE3\x82\xA4\xE3\x83\xB3\xE3\x82\xB9\xE3\x83\x88\xE3\x82\xA5\xE3\x83\xA1\xE3\x83\xB3\xE3\x82\xBF\xE3\x83\xAB\xE3\x83\x90\xE3\x83\xB3\xE3\x83\x89\xE3\x80\x821988\xE5\xB9\xB4\xE3\x81\xBE\xE3\x81\xA7\xE3\x81\xAF\xE3\x80\x81THE SQUARE\xEF\xBC\x88\xE3\x82\xB6\xE3\x83\xBB\xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xEF\xBC\x89\xE5\x90\x8D\xE7\xBE\xA9\xE3\x81\xA7\xE6\xB4\xBB\xE5\x8B\x95\xE3\x81\x97\xE3\x81\xA6\xE3\x81\x84\xE3\x81\x9F\xE3\x80\x82\xE9\x80\x9A\xE7\xA7\xB0\xE3\x81\xAF \xE3\x82\xB9\xE3\x82\xAF\xE3\x82\xA7\xE3\x82\xA2\xE3\x80\x82"
[9] pry(main)> client.search('artists', '*:*')
=> {"max_score"=>1.0,
 "num_found"=>1,
 "docs"=>
  [{"score"=>"1.00000000000000000000e+00",
    "_yz_rb"=>"artists",
    "_yz_rt"=>"maps",
    "_yz_rk"=>"4ncsFIb2PaVYKY251wm3RcFWGJF",
    "_yz_id"=>"1*maps*artists*4ncsFIb2PaVYKY251wm3RcFWGJF*57",
    "name_register"=>"T-SQUARE",
    "description_register"=>"T-SQUARE（ティー・スクェア）は、日本のインストゥメンタルバンド。1988年までは、THE SQUARE（ザ・スクェア）名義で活動していた。通称は スクェア。"}]}
[10] pry(main)> client.search('artists', 'description_register:日本')
=> {"max_score"=>0.1780794858932495,
 "num_found"=>1,
 "docs"=>
  [{"score"=>"1.78079490000000006944e-01",
    "_yz_rb"=>"artists",
    "_yz_rt"=>"maps",
    "_yz_rk"=>"4ncsFIb2PaVYKY251wm3RcFWGJF",
    "_yz_id"=>"1*maps*artists*4ncsFIb2PaVYKY251wm3RcFWGJF*56",
    "name_register"=>"T-SQUARE",
    "description_register"=>"T-SQUARE（ティー・スクェア）は、日本のインストゥメンタルバンド。1988年までは、THE SQUARE（ザ・スクェア）名義で活動していた。通称は スクェア。"}]}
[11] pry(main)> client.search('artists', 'name_register:T-SQUARE')
=> {"max_score"=>0.712317943572998,
 "num_found"=>1,
 "docs"=>
  [{"score"=>"7.12317940000000038303e-01",
    "_yz_rb"=>"artists",
    "_yz_rt"=>"maps",
    "_yz_rk"=>"4ncsFIb2PaVYKY251wm3RcFWGJF",
    "_yz_id"=>"1*maps*artists*4ncsFIb2PaVYKY251wm3RcFWGJF*57",
    "name_register"=>"T-SQUARE",
    "description_register"=>"T-SQUARE（ティー・スクェア）は、日本のインストゥメンタルバンド。1988年までは、THE SQUARE（ザ・スクェア）名義で活動していた。通称は スクェア。"}]}
```
