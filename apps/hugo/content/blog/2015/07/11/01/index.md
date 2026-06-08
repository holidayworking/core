---
date: 2015-07-11 21:00:00 +0900
title: Vagrant で VirtualBox の準仮想化を有効化する方法
tags:
  - vagrant
  - virtualbox
images:
  - blog/2015/07/11/01/20150711203356.png
---

VirtualBox 5.0 でサポートされた準仮想化を Vagrant で有効化するには`Vagrantfile`に下記を追加するだけである。

```ruby
config.vm.provider :virtualbox do |v|
  v.customize ['modifyvm', :id, '--paravirtprovider', 'kvm']
end
```

{{< screenshot src="20150711203356.png" >}}
