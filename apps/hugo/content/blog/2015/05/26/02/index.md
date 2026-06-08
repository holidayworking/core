---
date: 2015-05-26 14:56:00 +0900
title: riak-ruby-docker というものをつくってみた
tags:
  - docker
  - riak
  - ruby
---

[riak-ruby-vagrant](https://github.com/basho-labs/riak-ruby-vagrant)を参考に[riak-ruby-client](https://github.com/basho/riak-ruby-client)のテスト専用の Docker イメージである[riak-ruby-docker](https://registry.hub.docker.com/u/holidayworking/riak-ruby-docker)というものをつくってみた。

riak-ruby-client の RSpec がすべて成功していることを確認しているので、riak-ruby-vagrant と同じ環境が構築できているはず。

## 使い方

```bash
$ docker run -d -p 17017:8087 -p 17018:8098 holidayworking/riak-ruby-docker
```

boot2docker で Docker を起動している場合は、ポートフォワーディングの設定が必要となる。

```bash
$ VBoxManage controlvm "dev" natpf1 "riak-pb,tcp,127.0.0.1,17017,,17017"
$ VBoxManage controlvm "dev" natpf1 "riak-http,tcp,127.0.0.1,17018,,17018"
```

riak-ruby-client の RSpec が、Riak のホストをローカルホストを想定しているためである。
