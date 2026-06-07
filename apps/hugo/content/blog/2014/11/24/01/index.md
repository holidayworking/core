---
date: 2014-11-24 14:49:00 +0900
title: Fig で Ruby on Rails の CI 環境を構築する
tags:
  - docker
  - fig
  - ruby
  - rails
---

Docker のオーケストレーションツールである[Fig](http://www.fig.sh)で Rails の CI 環境を構築してみた。

CI 環境と言っても、下記を実行するだけ。

- RSpec
- RuboCop

構築した Rails プロジェクトは[GitHub](https://github.com/holidayworking/fig-rails-example)で公開しているので、試すだけなら次のように。

```bash
$ git clone https://github.com/holidayworking/fig-rails-example.git
$ cd fig-rails-example
$ ./bin/ci
```

## 解説

### fig.yml の準備

Fig でオーケストレーションをする場合は`fig.yml`を用意する必要がある。

```yaml
db:
  image: mysql:5.6.21
  environment:
    MYSQL_ROOT_PASSWORD: fig-rails-example
  ports:
    - 3306
app:
  build: .
  environment:
    FIG-RAILS-EXAMPLE_DATABASE_PASSWORD: fig-rails-example
  command: rails server -p 3000
  volumes:
    - .:/app
  ports:
    - 3000:3000
  links:
    - db
```

データベースのコンテナとして公式の[mysql イメージ](https://registry.hub.docker.com/_/mysql/)は、環境変数`MYSQL_ROOT_PASSWORD`を設定しないと起動してくれないので、適当な文字列を設定してある。Rails 側でも必要になるので環境変`FIG-RAILS-EXAMPLE_DATABASE_PASSWORD`を設定しておく。

### config/database.yml の変更

Rails 側でデータベースのホストとポート、パスワードを取得するために`config/database.yml`を次のように変更しておく。

```yaml
default: &default
  adapter: mysql2
  encoding: utf8
  pool: 5
  username: root
  password: <%= ENV['FIG-RAILS-EXAMPLE_DATABASE_PASSWORD'] %>
  host: <%= ENV.fetch('DB_PORT_3306_TCP_ADDR', 'localhost') %>
  port: <%= ENV.fetch('DB_PORT_3306_TCP_PORT', '3306') %>

development:
  <<: *default
  database: fig-rails-example_development

test:
  <<: *default
  database: fig-rails-example_test

production:
  <<: *default
  database: fig-rails-example_production
  username: fig-rails-example
```

### RSpec の実行

これで準備ができたので Docker コンテナーを起動して RSpec
が実行できるようになる。

```bash
$ fig build
$ fig up
```

Docker コンテナーの起動が完了したら、新しいターミナルを用意して RSpec
を実行する。

```bash
$ fig run app bundle exec rake db:setup
$ fig run app bundle exec rake spec
```

### シェルスクリプトの用意

Jenkins で実行することを想定して、 `./bin/ci`というシェルスクリプトを用意してみた。

```bash
#!/bin/sh

export FIG_PROJECT_NAME=fig-rails-example

# Docker で bundle の実行を高速化するためにファイル更新日時を一定にする
# refs : http://ssig33.com/text/Jenkins%20%E3%81%A7%20docker%20build%20%E3%81%99%E3%82%8B%E8%A9%B1
touch -t 201412121212.12 Gemfile
touch -t 201412121212.12 Gemfile.lock

fig build
fig up -d
sleep 30
fig run app /bin/sh -ex ./bin/ci_spec || RESULT=$?
fig stop
fig rm --force

exit $RESULT
```

`fig up`のオプションで`-d`を指定するとバックグラウンドで Docker コンテナーを起動してくれるんだけど、起動が完了したことを検知できなないので、30 秒スリープするようにしてある。環境によっては長すぎる場合があるので、この辺は調整していくしかない。起動が完了したことを簡単な方法で検知できればいいのだが…。

`./bin/ci_spec`は次のようなシェルスクリプト。

```bash
#!/bin/sh

export LANG=ja_JP.UTF-8
export RAILS_ENV=test

bundle exec rake db:create
bundle exec rake db:migrate
GENERATE_REPORTS=true bundle exec rake rspec
bundle exec rubocop --require rubocop/formatter/checkstyle_formatter --format RuboCop::Formatter::CheckstyleFormatter --out tmp/checkstyle.xml
```
