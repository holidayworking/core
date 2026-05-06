---
date: 2017-10-08 11:00:00 +0900
title: Mackerel のサービスメトリックで Resque のキュー数を可視化してみる
tags:
  - mackerel
  - ruby
  - resque
images:
  - blog/2017/10/08/01/20171008103215.png
---

Resque で非同期処理をすることが多いので、Mackerel のサービスメトリックで Resque のキュー数を可視化してみた。

## ソースコード

各キューごとのキュー数と、その合計値をサービスメトリックで登録するようにしている。

```ruby
#!/usr/bin/ruby

require 'mackerel-client'
require 'optparse'
require 'redis'

params = ARGV.getopts('', 'host:localhost', 'port:6379', 'namespace:resque', 'api-key:', 'service-name:')

redis = Redis.new(host: params['host'], port: params['port'].to_i)

metrics = []
time = Time.now.to_i

total = 0
redis.smembers("#{params['namespace']}:queues").each do |queue|
  value = redis.llen("#{params['namespace']}:queue:#{queue}").to_i
  total += value
  metrics << { name: "custom.resque.queue.#{queue}", time: time, value: value }
end

metrics << { name: 'custom.resque.pending', time: time, value: total }

mackerel = Mackerel::Client.new(mackerel_api_key: params['api-key'])
mackerel.post_service_metrics(params['service-name'], metrics)
```

## 使い方

cron で 1 分毎に実行する。

## 結果

{{< screenshot src="20171008103215.png" >}}

{{< screenshot src="20171008103223.png" >}}
