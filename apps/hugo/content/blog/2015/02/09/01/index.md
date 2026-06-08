---
date: 2015-02-09 10:23:00 +0900
title: Riak Search (Yokozuna) におけるインデックス登録エラーの原因調査方法
tags:
  - ruby
  - riak
---

Riak Search（Yokozuna）におけるインデックス登録エラーの原因調査をするためには、次の 2 つの方法が考えられる。

- ログファイルを確認する方法
- yokozuna_error_patch を使う方法

どちらの方法でも、次のように数値型の項目に対して文字列を登録した想定で説明していく。

```bash
curl -X PUT http://localhost:8098/types/animals/buckets/cats/keys/test -H 'Content-Type: application/json' -d '{ "name_i":"Snarf", "age_i":"hogehoge" }'
```

## ログファイルを確認する方法

ログファイル`/var/log/riak/solr.log`にエラー内容が出力されるので、このファイルを確認する方法である。この方法が一番簡単であるが、次のように Java のスタックトレースも出力されるため、エラーが大量に発生している場合等は原因を特定するのが難しいと思われる。

```bash
2015-02-08 09:12:15,011 [ERROR] <qtp2114119444-16>@SolrException.java:109 org.apache.solr.common.SolrException: ERROR: [doc=1*animals*cats*snarf*2] Error adding field 'age_i'='hogehoge' msg=For input string: "hogehoge"
        at org.apache.solr.update.DocumentBuilder.toDocument(DocumentBuilder.java:167)
        at org.apache.solr.update.AddUpdateCommand.getLuceneDocument(AddUpdateCommand.java:77)
        at org.apache.solr.update.DirectUpdateHandler2.addDoc0(DirectUpdateHandler2.java:234)
        at org.apache.solr.update.DirectUpdateHandler2.addDoc(DirectUpdateHandler2.java:160)
        at org.apache.solr.update.processor.RunUpdateProcessor.processAdd(RunUpdateProcessorFactory.java:69)
        at org.apache.solr.update.processor.UpdateRequestProcessor.processAdd(UpdateRequestProcessor.java:51)
        at org.apache.solr.update.processor.DistributedUpdateProcessor.versionAdd(DistributedUpdateProcessor.java:729)
        at org.apache.solr.update.processor.DistributedUpdateProcessor.processAdd(DistributedUpdateProcessor.java:556)
        at org.apache.solr.handler.loader.JsonLoader$SingleThreadedJsonLoader.processUpdate(JsonLoader.java:126)
        at org.apache.solr.handler.loader.JsonLoader$SingleThreadedJsonLoader.load(JsonLoader.java:101)
        at org.apache.solr.handler.loader.JsonLoader.load(JsonLoader.java:65)
        at org.apache.solr.handler.UpdateRequestHandler$1.load(UpdateRequestHandler.java:92)
        at org.apache.solr.handler.ContentStreamHandlerBase.handleRequestBody(ContentStreamHandlerBase.java:74)
        at org.apache.solr.handler.RequestHandlerBase.handleRequest(RequestHandlerBase.java:135)
        at org.apache.solr.core.SolrCore.execute(SolrCore.java:1916)
        at org.apache.solr.servlet.SolrDispatchFilter.execute(SolrDispatchFilter.java:780)
        at org.apache.solr.servlet.SolrDispatchFilter.doFilter(SolrDispatchFilter.java:427)
        at org.apache.solr.servlet.SolrDispatchFilter.doFilter(SolrDispatchFilter.java:217)
        at org.eclipse.jetty.servlet.ServletHandler$CachedChain.doFilter(ServletHandler.java:1419)
        at org.eclipse.jetty.servlet.ServletHandler.doHandle(ServletHandler.java:455)
        at org.eclipse.jetty.server.handler.ScopedHandler.handle(ScopedHandler.java:137)
        at org.eclipse.jetty.security.SecurityHandler.handle(SecurityHandler.java:557)
        at org.eclipse.jetty.server.session.SessionHandler.doHandle(SessionHandler.java:231)
        at org.eclipse.jetty.server.handler.ContextHandler.doHandle(ContextHandler.java:1075)
        at org.eclipse.jetty.servlet.ServletHandler.doScope(ServletHandler.java:384)
        at org.eclipse.jetty.server.session.SessionHandler.doScope(SessionHandler.java:193)
        at org.eclipse.jetty.server.handler.ContextHandler.doScope(ContextHandler.java:1009)
        at org.eclipse.jetty.server.handler.ScopedHandler.handle(ScopedHandler.java:135)
        at org.eclipse.jetty.server.handler.ContextHandlerCollection.handle(ContextHandlerCollection.java:255)
        at org.eclipse.jetty.server.handler.HandlerCollection.handle(HandlerCollection.java:154)
        at org.eclipse.jetty.server.handler.HandlerWrapper.handle(HandlerWrapper.java:116)
        at org.eclipse.jetty.server.Server.handle(Server.java:368)
        at org.eclipse.jetty.server.AbstractHttpConnection.handleRequest(AbstractHttpConnection.java:489)
        at org.eclipse.jetty.server.BlockingHttpConnection.handleRequest(BlockingHttpConnection.java:53)
        at org.eclipse.jetty.server.AbstractHttpConnection.content(AbstractHttpConnection.java:953)
        at org.eclipse.jetty.server.AbstractHttpConnection$RequestHandler.content(AbstractHttpConnection.java:1014)
        at org.eclipse.jetty.http.HttpParser.parseNext(HttpParser.java:861)
        at org.eclipse.jetty.http.HttpParser.parseAvailable(HttpParser.java:240)
        at org.eclipse.jetty.server.BlockingHttpConnection.handle(BlockingHttpConnection.java:72)
        at org.eclipse.jetty.server.bio.SocketConnector$ConnectorEndPoint.run(SocketConnector.java:264)
        at org.eclipse.jetty.util.thread.QueuedThreadPool.runJob(QueuedThreadPool.java:608)
        at org.eclipse.jetty.util.thread.QueuedThreadPool$3.run(QueuedThreadPool.java:543)
        at java.lang.Thread.run(Thread.java:724)
Caused by: java.lang.NumberFormatException: For input string: "hogehoge"
        at java.lang.NumberFormatException.forInputString(NumberFormatException.java:65)
        at java.lang.Integer.parseInt(Integer.java:492)
        at java.lang.Integer.parseInt(Integer.java:527)
        at org.apache.solr.schema.TrieField.createField(TrieField.java:597)
        at org.apache.solr.schema.TrieField.createFields(TrieField.java:660)
        at org.apache.solr.update.DocumentBuilder.addField(DocumentBuilder.java:47)
        at org.apache.solr.update.DocumentBuilder.toDocument(DocumentBuilder.java:118)
        ... 42 more
```

## yokozuna_error_patch を使う方法

[yokozuna_error_patch](https://github.com/basho-labs/yokozuna_error_patch)は、次のようにインストールする必要がある。

```bash
$ git clone https://github.com/basho-labs/yokozuna_error_patch.git
$ sudo cp yokozuna_error_patch/ebin/*.beam /usr/lib64/riak/lib/basho-patches
$ sudo service riak restart
```

インストール後に発生したエラーは`yz_err`インデックスに保存されるため、次のように確認できる。

```bash
$ curl -s 'http://localhost:8098/search/query/yz_err?wt=json&q=*:*' | jq .
{
  "response": {
    "docs": [
      {
        "_yz_rb": "animals.cats",
        "_yz_rt": "yz_err",
        "_yz_rk": "snarf",
        "_yz_id": "1*yz_err*animals.cats*snarf*18",
        "_yz_err_msg_s": "{\"Failed to index docs\",\n {ok,\"400\",\n     [{\"Content-Type\",\"application/json; charset=UTF-8\"},\n      {\"Transfer-Encoding\",\"chunked\"}],\n     <<\"{\\\"responseHeader\\\":{\\\"status\\\":400,\\\"QTime\\\":12},\\\"error\\\":{\\\"msg\\\":\\\"ERROR: [doc=1*animals*cats*snarf*2*17yRCTM2XV5Glgke25FfQO] Error adding field 'age_i'='hogehoge' msg=For input string: \\\\\\\"hogehoge\\\\\\\"\\\",\\\"code\\\":400}}\\n\">>}}",
        "_yz_err_rk_s": "snarf",
        "_yz_err_rt_s": "animals",
        "_yz_err_rb_s": "cats"
      }
    ],
    "maxScore": 1,
    "start": 0,
    "numFound": 1
  },
  "responseHeader": {
    "params": {
      "wt": "json",
      "192.168.33.10:8093": "_yz_pn:64 OR (_yz_pn:61 AND (_yz_fpn:61)) OR _yz_pn:60 OR _yz_pn:57 OR _yz_pn:54 OR _yz_pn:51 OR _yz_pn:48 OR _yz_pn:45 OR _yz_pn:42 OR _yz_pn:39 OR _yz_pn:36 OR _yz_pn:33 OR _yz_pn:30 OR _yz_pn:27 OR _yz_pn:24 OR _yz_pn:21 OR _yz_pn:18 OR _yz_pn:15 OR _yz_pn:12 OR _yz_pn:9 OR _yz_pn:6 OR _yz_pn:3",
      "q": "*:*",
      "shards": "192.168.33.10:8093/internal_solr/yz_err"
    },
    "QTime": 22,
    "status": 0
  }
}
```

ログファイルを確認する方法と違い、バケット (`_yz_err_rb_s`) やキー (`_yz_err_rk_s`) が分かりやすく表示されている。
