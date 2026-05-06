---
date: 2016-12-24 13:35:00 +0900
title: Groovy で Amazon Athena に接続してみた
tags:
  - groovy
  - aws
  - athena
---

Amazon Athena が JDBC 接続をサポートしているので Groovy で試してみた。

{{< hatenablog-parts url="https://github.com/holidayworking/groovy-athena-test" >}}

## 使い方

`s3_staging_dir` を適当なバケット名に変更する。バケットは Amazon Athena を実行するリージョンの同一にする必要があることに注意する。そして、`./gradlew run` を下記を実行する。問題が発生しなければ、次のようになるはずである。

```bash
$ ./gradlew run
:compileJava UP-TO-DATE
:compileGroovy UP-TO-DATE
:processResources UP-TO-DATE
:classes UP-TO-DATE
:run
log4j:WARN No appenders could be found for logger (com.amazonaws.athena.jdbc.AthenaDriver).
log4j:WARN Please initialize the log4j system properly.
log4j:WARN See http://logging.apache.org/log4j/1.2/faq.html#noconfig for more info.
500     22
302     13
304     60
200     4108
301     23
404     3

BUILD SUCCESSFUL

Total time: 7.662 secs
```
