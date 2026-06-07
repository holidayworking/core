---
date: 2015-06-28 15:35:00 +0900
title: 意見（評価表現）抽出ツール を Docker で動かせるようにした
tags:
  - docker
  - nlp
---

{{< hatenablog-parts url="https://github.com/holidayworking/docker-extractopinion" >}}

## Docker イメージのビルド

```bash
$ git@github.com:holidayworking/docker-extractopinion.git
$ cd docker-extractopinion
$ docker build -t holidayworking/extractopinion .
```

## 意見（評価表現）抽出ツールの実行

オプションなしで Docker コンテナを起動すると、意見（評価表現）抽出ツールに含まれているサンプルファイルを引数として`extract.sh`が実行されるようになっている。

```bash
$ docker run holidayworking/extractopinion
変換処理を開始します...
変換処理が終了しました...
/opt/extractopinion-1.2/sample.txt.euc  1       [著者]  メリット+       ビタミンが豊富だ。
/opt/extractopinion-1.2/sample.txt.euc  2
/opt/extractopinion-1.2/sample.txt.euc  3       [著者]  批評-   良くない。
/opt/extractopinion-1.2/sample.txt.euc  4       [著者]  当為    学校に行くべきだ。
/opt/extractopinion-1.2/sample.txt.euc  5       [著者]  メリット+       地域経済の活性化が図られるので、
/opt/extractopinion-1.2/sample.txt.euc  5       [著者]  メリット+       商機が拡大すると考えられる。
```

任意のファイルに対して`extract.sh`を実行したい場合は、次のように Docker コンテナを実行する。

```bash
$ cat sample.txt
ほうれん草はビタミンが豊富だ。
京都は日本にある。
商品Aは良くない。
太郎は学校に行くべきだ。
道州制は国の一律の規制が解かれ地域経済の活性化が図られるので、商機が拡大すると考えられる。
意見（評価表現）抽出ツール を Docker で動かせるようにした。
$ docker run -it -v `pwd`:/data holidayworking/extractopinion /opt/extractopinion-1.2/extract.sh /data/sample.txt
変換処理を開始します...
変換処理が終了しました...
/data/sample.txt.euc    1       [著者]  メリット+       ビタミンが豊富だ。
/data/sample.txt.euc    2
/data/sample.txt.euc    3       [著者]  批評-   良くない。
/data/sample.txt.euc    4       [著者]  当為    学校に行くべきだ。
/data/sample.txt.euc    5       [著者]  メリット+       地域経済の活性化が図られるので、
/data/sample.txt.euc    5       [著者]  メリット+       商機が拡大すると考えられる。
/data/sample.txt.euc    6
```
