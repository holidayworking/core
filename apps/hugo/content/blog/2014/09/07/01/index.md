---
title: "Riak Ruby Client で Riak Search (Yokozuna) を試してみた #0"
date: 2014-09-07 01:52:00 +0900
tags:
  - ruby
  - riak
---

Riak Ruby Client の [README](https://github.com/basho/riak-ruby-client/blob/master/README.markdown) のサンプルを試しただけ。

```ruby
$ rails c
Loading development environment (Rails 4.1.5)
[1] pry(main)> client = $riak
=> #<Riak::Client [#<Node 127.0.0.1:8087>]>
[2] pry(main)> bucket = client.bucket 'pizzas'
=> #<Riak::Bucket {pizzas}>
[3] pry(main)> client.create_search_index 'pizzas'
=> true
[4] pry(main)> client.set_bucket_props bucket, { search_index: 'pizzas' }, 'yokozuna'
=> true
[5] pry(main)> meat = bucket.new 'meat'
=> #<Riak::RObject {pizzas,meat} [#<Riak::RContent [application/json]:nil>]>
[6] pry(main)> meat.data = {toppings_ss: %w{pepperoni ham sausage}}
=> {:toppings_ss=>["pepperoni", "ham", "sausage"]}
[7] pry(main)> meat.store type: 'yokozuna'
=> #<Riak::RObject {pizzas,meat} [#<Riak::RContent [application/json]:{"toppings_ss"=>["pepperoni", "ham", "sausage"]}>]>
[8] pry(main)> hawaiian = bucket.new 'hawaiian'
=> #<Riak::RObject {pizzas,hawaiian} [#<Riak::RContent [application/json]:nil>]>
[9] pry(main)> hawaiian.data = {toppings_ss: %w{ham pineapple}}
=> {:toppings_ss=>["ham", "pineapple"]}
[10] pry(main)> hawaiian.store type: 'yokozuna'
=> #<Riak::RObject {pizzas,hawaiian} [#<Riak::RContent [application/json]:{"toppings_ss"=>["ham", "pineapple"]}>]>
[11] pry(main)> result = client.search('pizzas', 'toppings_ss:ham')
=> {"max_score"=>0.845849335193634,
 "num_found"=>2,
 "docs"=>
  [{"score"=>"8.45849340000000005091e-01", "_yz_rb"=>"pizzas", "_yz_rt"=>"yokozuna", "_yz_rk"=>"meat", "_yz_id"=>"1*yokozuna*pizzas*meat*28", "toppings_ss"=>"sausage"},
   {"score"=>"8.45849340000000005091e-01",
    "_yz_rb"=>"pizzas",
    "_yz_rt"=>"yokozuna",
    "_yz_rk"=>"hawaiian",
    "_yz_id"=>"1*yokozuna*pizzas*hawaiian*49",
    "toppings_ss"=>"pineapple"}]}
[12] pry(main)> result['num_found']
=> 2
[13] pry(main)> result['docs']
=> [{"score"=>"8.45849340000000005091e-01", "_yz_rb"=>"pizzas", "_yz_rt"=>"yokozuna", "_yz_rk"=>"meat", "_yz_id"=>"1*yokozuna*pizzas*meat*28", "toppings_ss"=>"sausage"},
 {"score"=>"8.45849340000000005091e-01", "_yz_rb"=>"pizzas", "_yz_rt"=>"yokozuna", "_yz_rk"=>"hawaiian", "_yz_id"=>"1*yokozuna*pizzas*hawaiian*49", "toppings_ss"=>"pineapple"}]
```
