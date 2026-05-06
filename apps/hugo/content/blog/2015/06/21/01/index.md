---
date: 2015-06-21 11:05:00 +0900
title: Homebrew で xhyve がインストールできるようになった
tags:
  - osx
  - homebrew
  - xhyve
---

[homebrew-head-only](https://github.com/Homebrew/homebrew-head-only) に xhyve が formula が追加されていた。

{{< hatenablog-parts url="https://github.com/Homebrew/homebrew-head-only/commit/e6feaf41048436a49118877a6c45fd0e9fe36a2f" >}}

この formula を使って xhyve をインストールするには、次のように実行すればよい。

```bash
$ brew tap homebrew/head-only
$ brew install --HEAD homebrew/head-only/xhyve
```
