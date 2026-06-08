---
date: 2016-04-24 11:35:00 +0900
title: Vagrant のプロバイダとして xhyve を使ってみた
tags:
  - vagrant
  - xhyve
---

現時点で Vagrant のプロバイダとして xhyve を提供するプラグインが 2 個存在している。

- [oldpatricka/vagrant-xhyve](https://github.com/oldpatricka/vagrant-xhyve)
- [sirn/vagrant-xhyve](https://github.com/sirn/vagrant-xhyve)

どちらのプラグインがよいかのを比較はしていないが、RubyGems で公開されているためインストールが簡単だった oldpatricka/vagrant-xhyve を試すことにした。

## 手順

### 1. インストール

RubyGems で公開されているので`vagrant plugin install`でインストールした。

```bash
$ vagrant plugin install vagrant-xhyve
```

このプラグインは[xhyve-ruby](https://github.com/dalehamel/xhyve-ruby)に同梱されている xhyve を使うようになっているので、xhyve 自体のインストールは不要である。

### 2. Vagrantfile の作成

Ubuntu 14.04 LTS の Box のみが提供されているので、この Box を起動する`Vagrantfile`を作成した。

```ruby
Vagrant.configure(2) do |config|
  config.vm.box = 'oldpatricka/ubuntu-14.04'

  config.nfs.functional = false
end
```

`config.nfs.functional`を`false`に設定している理由は、`vagrant up`時に次のエラーを発生させないためである。

```text
No host IP was given to the Vagrant core NFS helper. This is
an internal error that should be reported as a bug.
```

### 3. 起動

プロバイダに xhyve を指定して起動する必要がある。また、xhyve の制限があり root 権限で起動する必要がある。

```bash
$ sudo vagrant up --provider=xhyve
Bringing machine 'default' up with 'xhyve' provider...
==> default: Box 'oldpatricka/ubuntu-14.04' could not be found. Attempting to find and install...
    default: Box Provider: xhyve
    default: Box Version: >= 0
==> default: Loading metadata for box 'oldpatricka/ubuntu-14.04'
    default: URL: https://atlas.hashicorp.com/oldpatricka/ubuntu-14.04
==> default: Adding box 'oldpatricka/ubuntu-14.04' (v0.1.0) for provider: xhyve
    default: Downloading: https://atlas.hashicorp.com/oldpatricka/boxes/ubuntu-14.04/versions/0.1.0/providers/xhyve.box
==> default: Successfully added box 'oldpatricka/ubuntu-14.04' (v0.1.0) for 'xhyve'!
==> default: Checking if box 'oldpatricka/ubuntu-14.04' is up to date...
==> default: Importing box...
==> default: Done importing box.
==> default:  About to launch vm
==> default:  -- CPUs: 1
==> default:  -- Memory: 1024
==> default: [vagrant-hostsupdater] Checking for host entries
    default:
    default: Vagrant insecure key detected. Vagrant will automatically replace
    default: this with a newly generated keypair for better security.
    default:
    default: Inserting generated public key within guest...
    default: Removing insecure key from the guest if it's present...
    default: Key inserted! Disconnecting and reconnecting using new SSH key...
==> default: Rsyncing folder: /Users/hidekazu/xhyve-vagrant/ => /vagrant
```
