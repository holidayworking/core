---
date: 2017-02-27 15:01:00 +0900
title: Mackerel のメタデータに Amazon Linux のパッケージ情報を登録してみる
tags:
  - mackerel
---

mackerel-agent でメタデータの登録が対応したので、早速 Amazon Linux のパッケージ情報を登録してみることにした。

{{< hatenablog-parts url="https://mackerel.io/ja/blog/entry/weekly/20170224" >}}

## ソースコード

```perl
#!/usr/bin/env perl

use 5.016;
use warnings;
use utf8;
use JSON::PP qw/encode_json/;

my @lines = split(/\n/, `repoquery --all --installed --queryformat="%{name} %{arch} %{version}-%{release}"`);
my %packages;
for my $line (@lines) {
    my ($name, %info) = parse_package($line);
    next unless %info;
    $packages{$name} = \%info;
}
say encode_json \%packages;

sub parse_package {
    my $line = shift;
    my @items = split(/\s+/, $line);
    return $items[0], (
        architecture => $items[1],
        version      => $items[2]
    );
}
```

## 使い方

Mackerel エージェントの設定ファイルに下記を追加する。

```text
[plugin.metadata.packages]
command = "perl /path/to/mackerel-metadata-packages.pl"
execution_interval = 60
```

そうすると、60 分間隔でインストール済みのパッケージ情報がメタデータとして更新される。

たとえば、OpenSSL のバージョンを確認したい場合は次のようなコマンドを実行する。

```bash
$ curl -s -X GET -H 'X-Api-Key:<APIKEY>' https://mackerel.io/api/v0/hosts/<hostId>/metadata/packages | jq '.openssl'
{
  "architecture": "x86_64",
  "version": "1.0.1k-15.96.amzn1"
}
```
