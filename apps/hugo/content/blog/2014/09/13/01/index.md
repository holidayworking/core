---
date: 2014-09-13 17:10:00 +0900
title: Jenkins で bundle update を実行する
tags:
  - jenkins
  - ruby
---

ジョブのビルドに「シェルの実行」を追加して、次のスクリプトを実行するようにする。

```bash
git checkout -b bundle_update_`date +%Y%m%d`
bundle update
git add Gemfile.lock
git commit -m "bundle update"
git push origin bundle_update_`date +%Y%m%d`
hub pull-request -m "bundle update `date +%Y%m%d`" -b holidayworking:master -h holidayworking:bundle_update_`date +"%Y%m%d"
```
