---
date: 2014-09-15 14:50:00 +0900
title: Riak Search (Yokozuna) で日本語の全文検索を行う方法
tags:
  - ruby
  - riak
---

## はじめに

次のようにデータを保存しても、全文検索ができない。なぜかというと、Solr 側に全文検索の対象とするフィールドを教えてあげる必要があるからである。

```ruby
$ rails c
Loading development environment (Rails 4.1.5)
[1] pry(main)> client = Riak::Client.new
=> #<Riak::Client [#<Node 127.0.0.1:8087>]>
[2] pry(main)> bucket = client.bucket 'artists'
=> #<Riak::Bucket {artists}>
[3] pry(main)> client.create_search_index 'artists'
=> true
[4] pry(main)> client.set_bucket_props bucket, { search_index: 'artists' }
=> true
[5] pry(main)> casiopea = bucket.new 'casiopea'
=> #<Riak::RObject {artists,casiopea} [#<Riak::RContent [application/json]:nil>]>
[6] pry(main)> casiopea.data = { description: 'カシオペア (Casiopea) は、日本のフュージョンバンド。' }
=> {:description=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}
[7] pry(main)> casiopea.store
=> #<Riak::RObject {artists,casiopea} [#<Riak::RContent [application/json]:{"description"=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}>]>
[8] pry(main)> client.search('artists', '*:*')
=> {"max_score"=>1.0,
 "num_found"=>1,
 "docs"=>[{"score"=>"1.00000000000000000000e+00", "_yz_rb"=>"artists", "_yz_rt"=>"default", "_yz_rk"=>"casiopea", "_yz_id"=>"1*default*artists*casiopea*27"}]}
[9] pry(main)> client.search('artists', 'description:日本')
=> {"max_score"=>0.0, "num_found"=>0, "docs"=>[]}
```

これを解決するためには、次の方法が考えられる。

- 全文検索の対象とするフィールドを定義したスキーマを作成する
- [デフォルトスキーマ](https://github.com/basho/yokozuna/blob/develop/priv/default_schema.xml)に定義されているダイナミックフィールドを使う

今回は後者のダイナミックフィールドを使う方法について説明する。

## ダイナミックフィールドを使う方法

デフォルトスキーマのダイナミックフィールドは次のように定義されている。

```xml
<dynamicField name="*_cjk" type="text_cjk" indexed="true" stored="true" multiValued="true"/>
<dynamicField name="*_ja" type="text_ja" indexed="true" stored="true" multiValued="true"/>
```

`*_cjk` は bi-gram、`*_ja` は形態素解析で全文検索できる。

### bi-gram で全文検索してみる

全文検索の対象するフィールド名の終わりを `_cjk` とすることにより bi-gram で全文検索できるようになる。

```ruby
[10] pry(main)> casiopea = bucket.get_or_new 'casiopea'
=> #<Riak::RObject {artists,casiopea} [#<Riak::RContent [application/json]:{"description_ja"=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}>]>
[11] pry(main)> casiopea.data = { description_cjk: 'カシオペア (Casiopea) は、日本のフュージョンバンド。' }
=> {:description_cjk=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}
[12] pry(main)> casiopea.store
=> #<Riak::RObject {artists,casiopea} [#<Riak::RContent [application/json]:{"description_cjk"=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}>]>
[13] pry(main)> client.search('artists', 'description_cjk:日本')
=> {"max_score"=>0.15581955015659332,
 "num_found"=>1,
 "docs"=>
  [{"score"=>"1.55819550000000001111e-01",
    "_yz_rb"=>"artists",
    "_yz_rt"=>"default",
    "_yz_rk"=>"casiopea",
    "_yz_id"=>"1*default*artists*casiopea*28",
    "description_cjk"=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}]}
```

### 形態素解析で全文検索してみる

全文検索の対象するフィールド名の終わりを `_ja` とすることにより形態素解析で全文検索できるようになる。

```ruby
[14] pry(main)> casiopea = bucket.get_or_new 'casiopea'
=> #<Riak::RObject {artists,casiopea} [#<Riak::RContent [application/json]:{"description"=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}>]>
[15] pry(main)> casiopea.data = { description_ja: 'カシオペア (Casiopea) は、日本のフュージョンバンド。' }
=> {:description_ja=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}
[16] pry(main)> casiopea.store
=> #<Riak::RObject {artists,casiopea} [#<Riak::RContent [application/json]:{"description_ja"=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}>]>
[17] pry(main)> client.search('artists', 'description_ja:日本')
=> {"max_score"=>0.31163910031318665,
 "num_found"=>1,
 "docs"=>
  [{"score"=>"3.11639100000000002222e-01",
    "_yz_rb"=>"artists",
    "_yz_rt"=>"default",
    "_yz_rk"=>"casiopea",
    "_yz_id"=>"1*default*artists*casiopea*29",
    "description_ja"=>"カシオペア (Casiopea) は、日本のフュージョンバンド。"}]}
```

## Data Types で全文検索を行うには

Riak 2.0 から導入された Data Types で全文検索するにはスキーマを作成する方法しかない。

デフォルトスキーマでは次のように定義されている。

```xml
<!-- Riak datatypes default fields-->
<field name="counter" type="int"    indexed="true" stored="true" multiValued="false" />
<field name="set"     type="string" indexed="true" stored="false" multiValued="true" />
<!-- Riak datatypes embedded fields -->
<dynamicField name="*_flag"     type="boolean" indexed="true" stored="true" multiValued="false" />
<dynamicField name="*_counter"  type="int"     indexed="true" stored="true" multiValued="false" />
<dynamicField name="*_register" type="string"  indexed="true" stored="true" multiValued="false" />
<dynamicField name="*_set"      type="string"  indexed="true" stored="false" multiValued="true" />
```

Maps で文字列を保存する registers は、string 型で定義されているためである。そのため、次のようなフィールド定義したスキーマを作成する必要がある。

```xml
<field name="description_register" type="text_ja" indexed="true" stored="true" multiValued="true" />
```
