---
date: 2015-06-19 00:05:00 +0900
title: "Riak Ruby Client における MapReduce の問題点と対応方法 #2"
tags:
  - ruby
  - riak
---

次の記事の続き。

{{< hatenablog-parts url="https://holidayworking.org/blog/2015/05/26/01/" >}}

Riak Ruby Client における MapReduce には次の問題点があった。

- Secondary Indexes でバケットタイプを指定できない
- Riak Search（Yokozuna）を使うことができない

これらの問題を解決するるためにプルリクを作成した。

{{< hatenablog-parts url="https://github.com/basho/riak-ruby-client/pull/231" >}}

{{< hatenablog-parts url="https://github.com/basho/riak-ruby-client/pull/232" >}}

何か指摘されるのではドキドキしていたが、何の指摘もなくすんなりとマージされることになった。次のリリースではこれらの修正が含まれるはずなので、リリースを楽しみにしている。
