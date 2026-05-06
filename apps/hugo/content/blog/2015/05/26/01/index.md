---
date: 2015-05-26 00:12:00 +0900
title: "Riak Ruby Client における MapReduce の問題点と対応方法 #1"
tags:
  - ruby
  - riak
---

[以前のエントリー](https://holidayworking.org/blog/2015/01/18/01/)で挙げた次の問題点は、黙っていても解決しない感じなので行動を起こすこととにした。

- Secondary Indexes でバケットタイプを指定できない
- Riak Search（Yokozuna）を使うことができない

## Secondary Indexes でバケットタイプを指定することができない

master ブランチで [Riak::BucketTyped::Bucket](https://github.com/basho/riak-ruby-client/blob/v2.2.0.pre1/lib/riak/bucket_typed/bucket.rb) クラスが実装されて、バケットタイプを指定されたバケットと指定されていないバケットの判別が簡単にできるようになった。そのため、[Riak::MapReduce\#index](https://github.com/basho/riak-ruby-client/blob/v2.2.0.pre1/lib/riak/map_reduce.rb#L129) を次のように修正することにした。

```ruby
def index(bucket, index, query)
  if bucket.is_a? Bucket
    bucket = bucket.needs_type? ? [maybe_escape(bucket.type.name), maybe_escape(bucket.name)] : maybe_escape(bucket.name)
  else
    bucket = maybe_escape(bucket)
  end

  case query
  when String, Fixnum
    @inputs = {:bucket => bucket, :index => index, :key => query}
  when Range
    raise ArgumentError, t('invalid_index_query', :value => query.inspect) unless String === query.begin || Integer === query.begin
    @inputs = {:bucket => bucket, :index => index, :start => query.begin, :end => query.end}
  else
    raise ArgumentError, t('invalid_index_query', :value => query.inspect)
  end
  self
end
```

この修正を適用すると、次のような感じになる。

```ruby
bucket = client.bucket_type('yokozuna').bucket('my_bucket')

map_reduce = Riak::MapReduce.new(client)
map_reduce.index(bucket, 'time_int', Time.now.utc.beginning_of_day.to_i..Time.now.utc.end_of_day.to_i)
=> #<Riak::MapReduce:0x007f89e43246a8
 @client=#<Riak::Client [#<Node 127.0.0.1:17017>]>,
 @inputs={:bucket=>["yokozuna", "my_bucket"], :index=>"time_int", :start=>1432425600, :end=>1432511999},
 @query=[]>
```

[プルリク](https://github.com/basho/riak-ruby-client/pull/231)を作成済みなので、あとは反応を待つのみである。

## Riak Search （Yokozuna） を使うことができない

[Riak::MapReduce\#search](https://github.com/basho/riak-ruby-client/blob/v2.2.0.pre1/lib/riak/map_reduce.rb#L116) で指定されている `module` を `riak_search` から `yokozuna` に変更すればよさそうである。しかし、後方互換性を考えると変更していいのか分からない状態のため、Secondary Indexes のプルリクが解決したら考えることにする。
