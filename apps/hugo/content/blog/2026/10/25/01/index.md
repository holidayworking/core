---
date: 2026-10-26 18:00:00 +09:00
title: Claude Code の応答が途中で止まる問題を調べた
tags:
  - claude-code
  - openwrt
---

ここ数日、Claude Code のセッションで`Waiting for API response`のまま応答が止まり、最終的に`API Error: The response stopped arriving. The response above may be incomplete.`になることが多かった。原因は Linksys Velop WRT Pro 7 の設定で`net.ipv6.conf.all.proxy_ndp`が 0 になっていたことだった。

なお、記事中の IPv6 アドレスは、ドキュメント用のアドレス（`2001:db8::/32`）に置き換えている。

## 原因

Claude Code のトランスクリプトから API エラーを抜き出すと、次のようになっていた。

| 日時（JST） | メッセージ                           |
| ----------- | ------------------------------------ |
| 10-17 13:53 | Connection lost mid-response         |
| 10-24 21:18 | Connection lost mid-response         |
| 10-25 08:10 | Connection lost mid-response（2 件） |
| 10-25 09:11 | The response stopped arriving        |
| 10-25 09:24 | The response stopped arriving        |
| 10-25 09:34 | The response stopped arriving        |
| 10-25 13:51 | Connection lost mid-response         |
| 10-25 14:36 | Connection lost mid-response         |

`The response stopped arriving`の 3 件は、どれも同じ経過をたどっており、リクエストから 2〜4 秒で最初の出力（8〜32 トークン）が届き、その後は何も届かないまま約 180 秒でエラーになっていた。

デバッグログには、ストリームが途切れたときに次のような警告が出ていた。

```text
[WARN] [Stall] stream_idle_partial lastChunkAgeMs=30001 bytesTotal=2161 idleDeadlineMs=180000
```

Claude Code は IPv6 で`api.anthropic.com`（`2607:6bc0::10`、AS399358 Anthropic）に接続しており、8 ホップ、約 7ms で国内の Cloudflare に到達していた。

| hop | アドレス                  | 所属                           | RTT       |
| --- | ------------------------- | ------------------------------ | --------- |
| 1   | `2001:db8:1:1::1`         | 自宅ルーター                   | 2.6–2.9ms |
| 2   | `2001:db8:1:1::fffe`      | 上流（NTT 側）                 | 3.5–3.7ms |
| 3–4 | `* *`                     | 応答なし                       | –         |
| 5   | `2404:8e00:feed:ff2e::2`  | AS55391 INTERNET MULTIFEED     | 6.4ms     |
| 6   | `2001:7fa:7:1:0:1:3335:2` | IX（BGP には広告されていない） | 7.1ms     |
| 7–8 | `2400:cb00:...`           | AS13335 Cloudflare             | 7.0–7.8ms |

IPv4 では、ルーターから transix の DS-Lite を経由し、5 ホップで`160.79.104.10`に到達した。どちらの経路でも、traceroute を実行した時点ではロスや遅延の異常は見られなかった。

ルーターのログを遡ろうとしたものの、`log_size`がデフォルトの 64KB だったため、tailscaled のログで埋まってしまい、約 8 分しか残っていなかった。ストールが起きた時刻のログは、すでに消えていた。そこで、ログのバッファーを 8MB に増やしてみた。

```console
# uci set system.@system[0].log_size=8192
# uci commit system
# /etc/init.d/log restart
```

ログを延ばした後にストールが何度か起きたので、ルーターのログと突き合わせた。カーネルの経路変更を監視している tailscaled のログを見ると、Mac の IPv6 アドレス（`2001:db8:1:1:8c31:8c0e:f7f4:352d`）宛ての`/128`経路が追加され（`RTM_NEWROUTE`）、同じ秒のうちに削除される（`RTM_DELROUTE`）ことが、約 6 分おきに「10 秒間隔で 4 回」まとまって起きていた。ストールは、このまとまりと秒単位で一致していた。

| Mac の`RTM_DELROUTE`（JST）            | Claude Code                                                        |
| -------------------------------------- | ------------------------------------------------------------------ |
| 16:56:25〜16:56:55                     | 16:56:57 `ECONNRESET`                                              |
| 17:02:19〜17:02:49                     | リクエストなし                                                     |
| 17:08:08〜17:08:38                     | 17:08:07 からストール                                              |
| 17:13:57〜17:14:27                     | 17:14:07 からストール                                              |
| 17:19:45、17:19:55、17:20:05、17:20:15 | 17:19:48、17:19:56、17:20:05 に`ECONNRESET`、17:20:15 からストール |
| 17:25:36〜17:26:06                     | 17:25:47 `ECONNRESET`、17:25:56 からストール                       |

ストリームが流れているときにこのまとまりが来ると失敗し、流れていなければ何も起きなかった。まとまりの外で失敗したことは一度もなかった。同じパターンは、Mac 以外の LAN 端末でも、それぞれ別の周期で起きていた。

この経路の追加と削除は、odhcpd の relay の実装で説明できた。インストールされている odhcpd（2020-05-03、`49e4949c`）の`src/ndp.c`では、relay しているインターフェースで NS（近隣要請）を受け取ると、他の relay インターフェースで`ping6()`を呼んでいた。`ping6()`は近隣キャッシュを更新するためのもので、対象アドレスへの一時的な`/128`経路（metric 128）を張って ICMP Echo を送り、すぐにその経路を消していた。

```c
netlink_setup_route(addr, 128, iface->ifindex, NULL, 128, true);
odhcpd_send(iface->ndp_ping_fd, &dest, &iov, 1, iface);
netlink_setup_route(addr, 128, iface->ifindex, NULL, 128, false);
```

Mac 宛ての一時経路は`br-lan`に張られていたので、Mac のアドレスを問い合わせる NS は WAN 側から届いていたと分かった。つまり、NTT 側のルーターが Mac のアドレスについて、10 秒おきに 4 回 NS を送っていた。

最初は、この一時経路の変化をきっかけに、ルーターの QCA NSS のハードウェアオフロード（ECM）から接続が外れるのではないかと考えた。外れた後は conntrack のシーケンス番号の追跡がずれるので、INVALID と判定されてファイアウォールで落とされる、という見立てだった。実際に、ストールした接続は ECM から消えていて、conntrack では`ESTABLISHED`のまま更新が止まっていた。

そこで、ECM の IPv6 オフロードを止めてみようとした。

```console
# echo 1 > /sys/kernel/debug/ecm/front_end_ipv6_stop
```

しかし、この値は 10 秒ほどで 0 に戻ってしまい、何が戻しているのかも分からなかった。

この見立て自体は、否定されたわけではなかった。ただ、一時経路が張られた後に何が起きるかばかりを見ていて、そもそも NS が繰り返される理由を見落としていた。NUD（Neighbor Unreachability Detection）の NS は、相手から NA（近隣広告）が返れば 1 回で終わるはずだった。NTT 側のルーターが 10 秒おきに 4 回も NS を送っているのは、NA が返っていないからだと考えるべきだった。

NTT 側のルーターが NUD で送る NS は、Mac のアドレス宛てのユニキャストだった。この NS は自宅ルーター宛てではないので、Linux では受信処理ではなく転送処理（`ip6_forward()`）に回っていた。Linux 5.4 の`net/ipv6/ip6_output.c`を見ると、転送処理で proxy NDP を扱うかどうかは、`all.proxy_ndp`だけで判定していた。

```c
    /* XXX: idev->cnf.proxy_ndp? */
    if (net->ipv6.devconf_all->proxy_ndp &&
        pneigh_lookup(&nd_tbl, net, &hdr->daddr, skb->dev, 0)) {
        int proxied = ip6_forward_proxy_check(skb);
        if (proxied > 0)
            return ip6_input(skb);
```

一方、マルチキャストの NS を扱う`net/ipv6/ndisc.c`は、`all.proxy_ndp`とインターフェースごとの`proxy_ndp`のどちらかが 1 なら proxy として応答していた。

```c
            (idev->cnf.forwarding &&
             (net->ipv6.devconf_all->proxy_ndp || idev->cnf.proxy_ndp) &&
```

自宅ルーターの値を確認すると、`eth4`と`br-lan`の`proxy_ndp`は odhcpd が 1 にしていたが、`all.proxy_ndp`は 0 だった。

```console
# for i in all eth4 br-lan; do echo "$i proxy_ndp=$(cat /proc/sys/net/ipv6/conf/$i/proxy_ndp)"; done
all proxy_ndp=0
eth4 proxy_ndp=1
br-lan proxy_ndp=1
```

このため、アドレス解決のためのマルチキャストの NS には応答できていたが、NUD のユニキャストの NS には応答できていなかった。NTT 側のルーターは NUD に失敗し、Mac のアドレスについて NS を繰り返していた。ストールは、この繰り返しと秒単位で一致していた。

ただし、接続が途切れる仕組みまでは確定できなかった。NUD に失敗した NTT 側のルーターが Mac 宛てのパケットを落としているのか、NS のたびに odhcpd が張る一時経路で ECM から接続が外れているのか、手元のログからは見分けられなかった。

## 対策

`all.proxy_ndp`を 1 にした。

```console
# sysctl -w net.ipv6.conf.all.proxy_ndp=1
```

適用後は、各端末で NS のまとまりが「10 秒間隔で 4 回」から 1 回に減った。NTT 側のルーターの NUD に、proxy で応答できるようになったということだった。

| 端末          | 適用前                          | 適用後（JST）                                  |
| ------------- | ------------------------------- | ---------------------------------------------- |
| Mac           | 10 秒間隔で 4 回（約 6 分おき） | 1 回（18:07:39、18:13:10、18:18:38、18:24:18） |
| 他の LAN 端末 | 10 秒間隔で 3〜4 回             | 1 回                                           |

適用後の約 20 分間に Claude Code が送った 36 リクエストでは、ストールと`ECONNRESET`のどちらも起きなかった。ただし、odhcpd は NS を受けるたびに一時経路を張るので、NS が 1 回に減っても一時経路の変化は残っていた。適用後に Mac 宛ての NS は 4 回来たが、どれも Claude Code がリクエストを送っていない時間帯だったので、ストリームの途中で 1 回だけの NS が来たときに接続が途切れないかは、確認できなかった。

`sysctl -w`での変更は、ルーターを再起動すると元に戻ってしまうため、次の手順で永続化した。

まず、`/etc/sysctl.d/`に設定ファイルを作った。同じディレクトリーの`99-auto-ipoe.conf`にも`proxy_ndp`の設定が並んでいるが、これはファームウェアの mapv6 が生成し直したり削除したりするファイルなので、追記せずに別のファイルにした。

```console
# cat > /etc/sysctl.d/99-proxy-ndp.conf <<'EOF'
# Answer unicast NUD probes from the upstream router for relayed LAN addresses.
# ip6_forward() checks only all.proxy_ndp, not the per-interface value set by odhcpd.
net.ipv6.conf.all.proxy_ndp=1
EOF
```

`/etc/init.d/sysctl`は起動時に`/etc/sysctl.d/*.conf`を読み込むので、これで再起動後も有効になった。作ったファイルをすぐに読み込んで、値も確認した。

```console
# sysctl -p /etc/sysctl.d/99-proxy-ndp.conf
net.ipv6.conf.all.proxy_ndp = 1
# cat /proc/sys/net/ipv6/conf/all/proxy_ndp
1
```

次に、ファームウェアを更新しても残るように、`/etc/sysupgrade.conf`に追加した。`sysupgrade -l`で、保持されるファイルの一覧に入ったことも確認した。

```console
# echo /etc/sysctl.d/99-proxy-ndp.conf >> /etc/sysupgrade.conf
# sysupgrade -l | grep sysctl
/etc/sysctl.conf
/etc/sysctl.d/99-proxy-ndp.conf
```
