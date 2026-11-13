---
date: 2026-11-14 08:00:00 +09:00
title: F1 のライブタイミングが止まる問題を調べた
tags:
  - f1
  - openwrt
---

少し前の話になるが、10 月 26 日のアメリカ GP の決勝を見ながら iPad で F1 アプリのライブタイミングを開いていたら、何度も表示が止まった。Mac の MultiViewer でも同じように止まっていた。原因は Linksys Velop WRT Pro 7 の Qualcomm NSS のハードウェアオフロード（ECM）で、`qca-nss-ecm`を止めると切断が起きなくなった。

調べた直後にメモだけ書いて、そのままになっていたのを、ようやく記事にまとめた。調査は Claude Code に任せたが、見当違いの仮説を何度も立てては取り下げたので、その経過も含めて残しておく。時刻はすべて日本時間で書いている。

## 調査

最初に疑ったのは Wi-Fi だった。ルーターは 2.4GHz、5GHz、6GHz のすべてに同じ SSID を設定しており、hostapd のログを見ると、iPad がレース中に 5GHz と 6GHz の間を数分おきに行き来していた。

| 時刻（10-26） | 動き                         |
| ------------- | ---------------------------- |
| 04:44:03      | 5GHz に接続し、6GHz 側を切断 |
| 04:47:04      | 6GHz に接続し、5GHz 側を切断 |
| 04:50:39      | 5GHz に接続し、6GHz 側を切断 |
| 05:05:42      | 6GHz に接続                  |
| 05:06:35      | 5GHz に接続                  |

MLO もバンドステアリング（`ezlbd`）も無効だったので、iPad が自分で帯域を選び直していたことになる。帯域が変わるたびに接続が途切れると考えて、6GHz を止めてみた。

```console
# uci set wireless.wifi2.disabled=1
# uci commit wireless
# wifi down wifi2
```

しかし、iPad が 5GHz に落ち着いた後も、ライブタイミングは止まった。帯域の切り替えは、少なくとも主な原因ではなかった。

次に、DNS と回線を確認した。AdGuard Home のクエリーログを見ても、F1 関連のドメインはひとつもブロックされておらず、応答は数十 ms 以内に返っていた。DS-Lite（transix）のトンネルも 32 時間つながりっぱなしで、ルーターから`1.1.1.1`や AFTR への ping は 120 発中ロス 0 だった。

大きな手がかりになったのは、MultiViewer のログ（`~/Library/Application Support/MultiViewer/logs/main-YYYY-MM-DD.log`）だった。決勝が始まってから、livetiming の WebSocket が 1〜5 分おきに切れては、つなぎ直していた。

```text
04:51:45 Error: Connection disconnected with error 'Error: Server timeout elapsed without receiving a message from the server.'.
04:51:47 Information: WebSocket connected to wss://livetiming.formula1.com/signalrcore?...
04:52:40 Error: Connection disconnected with error 'Error: WebSocket closed with status code: 1006 (no reason given).'.
04:52:42 Information: WebSocket connected to wss://livetiming.formula1.com/signalrcore?...
```

前日の予選のログでも、1〜4 分おきに同じことが起きていた。Mac は Wi-Fi のイベントが一度もないまま切れていたので、Wi-Fi ではなく、その先に原因があると分かった。

`livetiming.formula1.com`は CloudFront で配信されており、AAAA レコードがない。つまり、ライブタイミングは必ず IPv4 で、DS-Lite を通る。

どこで止まっているのかを絞るため、Mac から 3 か所に同時に ping を打ち、ルーターからも打って比べた。

| 送信元 → 宛先            | ロス               |
| ------------------------ | ------------------ |
| Mac → ルーター           | 0%（360 発中 0）   |
| Mac → `1.1.1.1`（IPv4）  | 1.1%（360 発中 4） |
| Mac → Cloudflare（IPv6） | 0%（360 発中 0）   |
| ルーター → `1.1.1.1`     | 0%（120 発中 0）   |
| ルーター → AFTR          | 0%（120 発中 0）   |

LAN の端末から IPv4 で外に出るときだけロスしていた。ルーター自身が送るパケットはハードウェアオフロードを通らないので、ルーターからの ping が正常でも、ルーターを原因から外す根拠にはならなかった。

ただ、1.1% のロスでは TCP の接続は切れない。30 秒間何も届かないような途切れは、ping に一度も現れなかった。回線全体ではなく、特定の接続だけが止まっていた。

そこでハードウェアオフロードを疑い、ECM の IPv4 のオフロードを止めるフラグを立ててみた。

```console
# echo 1 > /sys/kernel/debug/ecm/front_end_ipv4_stop
# echo 1 > /sys/kernel/debug/ecm/ecm_db/defunct_all
```

しかし、その後も切断は続いた。カウンターを見ると、IPv4 で 48 本の接続がまだオフロードされていた。このルーターの ECM は PPE というエンジンを使っており、停止フラグはそちらには効いていなかった。

```console
# cat /sys/kernel/debug/ecm/ecm_ppe_ipv4/accelerated_count
48
```

この間に、次のことも確かめたが、どれも原因ではなかった。

- conntrack で、通信が続いている接続の残り時間が 300 秒を切っていたのを不自然だと思った。しかし、これは確認応答を待っている接続に使われる`nf_conntrack_tcp_timeout_unacknowledged`（300 秒）だった。
- DF ビット付きの大きい ping が 1428 バイト以上で通らなかったが、ルーターは`frag needed and DF set (MTU 1452)`を正しく返しており、PMTU ブラックホールではなかった。
- ファイアウォールの再読み込みやインターフェースのイベントで conntrack が消されているのではないかと疑ったが、どちらも起きていなかった。

最後に、ルーターの 3 か所（LAN 側の`br-lan`、トンネルの`ds-dslite`、WAN 側の`eth4`）で livetiming 宛ての通信を 4 分間キャプチャした（Mac の tcpdump は権限がなく使えなかった）。

```console
# tcpdump -i br-lan -s 128 -w /tmp/lan.pcap "net 3.175.227.0/24"
# tcpdump -i ds-dslite -s 128 -w /tmp/ds.pcap "net 3.175.227.0/24"
# tcpdump -i eth4 -s 200 -w /tmp/eth4.pcap "ip6 proto 4"
```

iPad の接続のひとつ（ポート 61661）は、次のようになっていた。

| 時刻               | 見えた場所  | パケット                            |
| ------------------ | ----------- | ----------------------------------- |
| 05:48:34〜05:48:45 | `br-lan`    | iPad → サーバー FIN（6 回再送）     |
| 05:48:47           | `br-lan`    | iPad → サーバー RST                 |
| 05:52:09           | `ds-dslite` | サーバー → iPad データ（31 バイト） |
| 05:52:09           | `ds-dslite` | iPad → サーバー RST                 |

iPad が接続を閉じようと送った FIN と RST は、LAN 側には届いていたが、トンネル側と WAN 側には出ていなかった。オフロードされたパケットは tcpdump に映らないので、見えなかっただけという可能性もある。ただ、サーバーは 3 分半後に、この接続がまだ生きているつもりでデータを送ってきた。FIN と RST は、サーバーに届いていなかったことになる。

別の接続（ポート 61662）は、conntrack に`ESTABLISHED`なのに`[UNREPLIED]`という状態で載っていた。ルーターが接続の情報を途中で失い、続きのパケットで作り直したときの状態だ。この接続では、iPad のパケットが WAN 側に 14 回出ていったが、返事は一度も戻ってこなかった。

どちらの接続も、ECM がオフロードしている間に、ルーターの中でパケットか接続の情報が失われていた。

## 対策

ECM を止めることにした。

```console
# /etc/init.d/qca-nss-ecm stop
```

05:54:45 に止め、その直後に 1 回切れて 05:55:08 につなぎ直した後は、06:05:09 までの 10 分間、MultiViewer の切断は 1 回も起きなかった。それまでは 1〜2 分おきに切れていた。iPad も、同じ接続が切れずに続いた。

このままでは再起動すると ECM が戻ってしまうので、自動起動も無効にした。

```console
# /etc/init.d/qca-nss-ecm disable
```
