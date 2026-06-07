---
date: 2017-12-22 08:00:00 +0900
title: Mackerel と Capistrano の連携方法
tags:
  - mackerel
  - ruby
  - rails
  - capistrano
images:
  - blog/2017/12/22/01/20171220090226.png
---

この記事は[Mackerel Advent Calendar 2017](https://qiita.com/advent-calendar/2017/mackerel)の 22 日目の記事である。

今年の 2 月頃から仕事で Mackerel を使い出して、次のプラグインを作成した。

- [mackerel-plugin-aws-kinesis-firehose](https://github.com/mackerelio/mackerel-plugin-aws-kinesis-firehose)
- [mackerel-plugin-aws-rekognition](https://github.com/mackerelio/mackerel-plugin-aws-rekognition)
- [mackerel-plugin-aws-waf](https://github.com/mackerelio/mackerel-plugin-aws-waf)

プラグインの作成を振り返ってみても良かったけど、仕事で携わっているサービスは Ruby on Rails で開発しており、デプロイに Capistrano を使っているので、Mackerel と Capistrano の連携方法について書くことにした。

## デプロイ対象のホストを Mackerel から取得

[Mackerel のヘルプにも連携方法](https://mackerel.io/ja/docs/entry/advanced/capistrano-2.x)が書かれているが、Capistrano 2.x を前提としているため Capistrano 3.x で同じことをやろうとすると、少し修正が必要である。

まずは`Capfile`で[mackerel-client](https://rubygems.org/gems/mackerel-client)を読み込むようにする。

```ruby
require "capistrano/setup"

require "capistrano/deploy"

require "capistrano/scm/git"
install_plugin Capistrano::SCM::Git

require "capistrano/rbenv"
require "capistrano/bundler"
require "capistrano/rails/assets"
require "capistrano/rails/migrations"

require 'mackerel/client'

Dir.glob("lib/capistrano/tasks/*.rake").each { |r| import r }
```

そして、`config/deploy/production.rb`で Mackerel からデプロイ対象のホストを取得するようにする。

```ruby
set :mackerel_api_key, ENV.fetch('MACKEREL_API_KEY')

def host_ip_addrs(role)
  client = Mackerel::Client.new(mackerel_api_key: fetch(:mackerel_api_key))

  hosts = client.get_hosts(service: fetch(:application), roles: role).select do |host|
    host.status == 'standby' || host.status == 'working'
  end

  hosts.map do |host|
    interface = host.interfaces.find { |i| i['name'].match(/^eth/) }
    interface['ipAddress'] if interface
  end.compact
end

role :app, host_ip_addrs(:app)
role :web, host_ip_addrs(:app)
role :db,  host_ip_addrs(:app)
```

これで、ステータスが working または standby になっているホストに対してデプロイが実行されるようになる。

## デプロイ時に Mackerel のグラフアノテーションへ投稿

`config/deploy/production.rb`に下記をすると、グラフアノテーションへ投稿できる。

```ruby
namespace :deploy do
  task :starting do
    set :deploy_started_at, Time.now.to_i
  end

  task :finished do
    deploy_finished_at = Time.now.to_i
    annotation = {
      title: 'deploy application',
      description: "link: https://github.com/holidayworking/#{fetch(:application)}/commit/#{fetch(:current_revision)}",
      from: fetch(:deploy_started_at),
      to: deploy_finished_at,
      service: fetch(:application)
    }
    client = Mackerel::Client.new(mackerel_api_key: fetch(:mackerel_api_key))
    client.post_graph_annotation(annotation)
  end
end
```

この状態でデプロイすると、次のようにグラフアノテーションが投稿される。

{{< screenshot src="20171220090226.png" >}}

デプロイしたリビジョンをもとに GitHub のコミットログへのリンクを生成しているので、どの時点で何をデプロイしたかも分かるので便利である。
