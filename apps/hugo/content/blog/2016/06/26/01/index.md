---
date: 2016-06-26 15:45:00 +0900
title: Amazon Linux 2016.03 で Nginx をインストールする Itamae レシピ
tags:
  - linux
  - amazon
  - itamae
---

Amazon Linux のレポジトリからではなく、Nginx の公式レポジトリからインストールしたかったので、Itamae のレシピを書いてみた。

```ruby
package 'http://nginx.org/packages/centos/6/noarch/RPMS/nginx-release-centos-6-0.el6.ngx.noarch.rpm' do
  not_if 'rpm -q nginx-release-centos'
end

package 'nginx' do
  options '--disablerepo=amzn-main,amzn-updates'
end
```
