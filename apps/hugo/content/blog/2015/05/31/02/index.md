---
date: 2015-05-31 16:29:05 +0900
title: Kitematic 0.6.3 が起動しない場合の解決方法
tags:
  - osx
  - docker
  - kitematic
images:
  - blog/2015/05/31/02/20150531162840.png
---

Kitematic を 0.6.3 にバージョンアップしたところ、白い画面となり起動しない問題に遭遇した。

{{< screenshot src="20150531161700.png" >}}

再起動を何度か試しても解決しなかったので、コマンドラインから実行したところ、エラーが発生していることが分かった。

```bash
$ ~/Applications/Kitematic\ \(Beta\).app/Contents/MacOS/Kitematic\ \(Beta\)
[2130:0531/145122:WARNING:dns_config_service_posix.cc(150)] dns_config has unhandled options!
[2132:0531/145122:INFO:renderer_main.cc(200)] Renderer process started
[2130:0531/145122:INFO:CONSOLE(109)] "Download the React DevTools for a better development experience: https://fb.me/react-devtools", source: /opt/homebrew-cask/Caskroom/kitematic/0.6.3/Kitematic (Beta).app/Contents/Resources/app/node_modules/react/lib/React.js (109)
[2130:0531/145123:INFO:CONSOLE(239)] "[Bugsnag] Invalid API key 'undefined'", source: /opt/homebrew-cask/Caskroom/kitematic/0.6.3/Kitematic (Beta).app/Contents/Resources/app/node_modules/bugsnag-js/src/bugsnag.js (239)
[2130:0531/145123:INFO:CONSOLE(326)] "Uncaught Error: Cannot find module 'classNames'", source: module.js (326)
```

このエラーを解決方法が分からなかったので、イシューとして報告した。

{{< hatenablog-parts url="https://github.com/kitematic/kitematic/issues/568" >}}

そしたら、早速 mater ブランチでこのバグを修正したと返事が返ってきた。

{{< hatenablog-parts url="https://github.com/kitematic/kitematic/commit/7abd94fc30276bf9d95af51ddf0db764dd295f5f" >}}

このバグを修正したものはまだリリースされないようなので、次のように直接修正することにした。

```bash
$ cd ~/Applications/Kitematic\ \(Beta\).app/Contents/Resources/app/
$ diff -u build/components/Header.react.js.orig build/components/Header.react.js
--- build/components/Header.react.js.orig       2015-05-31 16:25:30.000000000 +0900
+++ build/components/Header.react.js    2015-05-31 16:25:38.000000000 +0900
@@ -12,7 +12,7 @@
 var accountStore = require('../stores/AccountStore');
 var accountActions = require('../actions/AccountActions');
 var Router = require('react-router');
-var classNames = require('classNames');
+var classNames = require('classnames');

 var Header = React.createClass({
   displayName: 'Header',
```

そしたら、問題なく起動できた。

{{< screenshot src="20150531162840.png" >}}
