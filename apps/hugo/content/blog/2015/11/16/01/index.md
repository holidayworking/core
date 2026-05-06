---
date: 2015-11-16 15:21:25 +0900
title: One-Class SVM で外れ値検出ができる gem を作った
tags:
  - ruby
---

One-Class SVM で外れ値検出ができる gem を作った。

{{< hatenablog-parts url="https://github.com/holidayworking/hazure" >}}

元々は会社で開発している Rails アプリケーション内に実装した外れ値検出ライブラリだったけど、汎用性があるように実装していたので gem として公開することにした。

## 使い方

One-Class SVM のモデルを構築する必要があるので、オブジェクト作成時に訓練データを渡してやる。

```ruby
detector = Hazure::Detector.new([[1,0,0], [1,0,0]])
```

モデルが構築後は `Hazure::Detector#outlier?` の引数に判定したいデータを渡す。

```ruby
detector.outlier?([10, 0, 0])
# => true
```

`Hazure::Detector#outlier?` の返り値が `true` の場合が外れ値で `false` の場合が正常値となる。
