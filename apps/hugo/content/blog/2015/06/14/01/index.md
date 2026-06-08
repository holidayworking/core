---
date: 2015-06-14 15:30:00 +0900
title: CircleCI で Phoenix アプリケーションのテストを実行する
tags:
  - elixir
  - phoenix
  - circleci
images:
  - blog/2015/06/14/01/20150614145749.png
---

Phoenix アプリケーションを Heroku へデプロイできるようになったので、[CircleCI](https://circleci.com)でテストを実行するようにしてみた。

CircleCI は Erlang と Elixir をサポートしていないため、テスト実行時に Erlang と Elixir をビルドする必要がある。ビルドスクリプトを Gist で公開している方がいたので、今回はこのスクリプトを使うことにした。

## 手順

1. CircleCI の設定ファイルとビルドスクリプトの作成
2. junit-formatter の追加
3. CircleCI でテストを実行

### CircleCI の設定ファイルとビルドスクリプトの作成

次の設定ファイルとビルドスクリプトを作成する必要がある。

- `circle.yml`
- `script/ci/prepare.sh`
- `script/ci/test.sh`

#### `circle.yml`

```yaml
dependencies:
  pre:
    - script/ci/prepare.sh
  cache_directories:
    - ~/dependencies
    - ~/.mix
    - _build
    - deps

test:
  override:
    - script/ci/test.sh
    - mkdir -p $CIRCLE_TEST_REPORTS/exunit
    - cp _build/test/test-junit-report.xml $CIRCLE_TEST_REPORTS/exunit
```

テストの実行結果を JUnit 形式の XML で出力するようにして、CircleCI が指定する場所へコピーするようにした。このようにすることで、次のようにテスト結果が表示されるようになる。

{{< screenshot src="20150614145749.png" >}}

#### `script/ci/prepare.sh`

Erlang と Elixir をビルドするスクリプトである。

ビルドするバージョンは次のとおりである。

- Erlang 17.5
- Elixir v1.0.4

それぞれ、環境変数`ERLANG_VERSION`と`ELIXIR_VERSION`で定義しているため、新しいバージョンがリリースされた場合はこれらの環境変数を変更すればよい。

```bash
#!/bin/bash

set -e

export ERLANG_VERSION="17.5"
export ELIXIR_VERSION="v1.0.4"

# If you have a elixir_buildpack.config, do this instead:
#export ERLANG_VERSION=$(cat elixir_buildpack.config | grep erlang_version | tr "=" " " | awk '{ print $2 }')
#export ELIXIR_VERSION=v$(cat elixir_buildpack.config | grep elixir_version | tr "=" " " | awk '{ print $2 }')

export INSTALL_PATH="$HOME/dependencies"

export ERLANG_PATH="$INSTALL_PATH/otp_src_$ERLANG_VERSION"
export ELIXIR_PATH="$INSTALL_PATH/elixir_$ELIXIR_VERSION"

mkdir -p $INSTALL_PATH
cd $INSTALL_PATH

# Install erlang
if [ ! -e $ERLANG_PATH/bin/erl ]; then
  curl -O http://www.erlang.org/download/otp_src_$ERLANG_VERSION.tar.gz
  tar xzf otp_src_$ERLANG_VERSION.tar.gz
  cd $ERLANG_PATH
  ./configure --enable-smp-support \
              --enable-m64-build \
              --disable-native-libs \
              --disable-sctp \
              --enable-threads \
              --enable-kernel-poll \
              --disable-hipe \
              --without-javac
  make

  # Symlink to make it easier to setup PATH to run tests
  ln -sf $ERLANG_PATH $INSTALL_PATH/erlang
fi

# Install elixir
export PATH="$ERLANG_PATH/bin:$PATH"

if [ ! -e $ELIXIR_PATH/bin/elixir ]; then
  git clone https://github.com/elixir-lang/elixir $ELIXIR_PATH
  cd $ELIXIR_PATH
  git checkout $ELIXIR_VERSION
  make

  # Symlink to make it easier to setup PATH to run tests
  ln -sf $ELIXIR_PATH $INSTALL_PATH/elixir
fi

export PATH="$ERLANG_PATH/bin:$ELIXIR_PATH/bin:$PATH"

# Install package tools
if [ ! -e $HOME/.mix/rebar ]; then
  yes Y | LC_ALL=en_GB.UTF-8 mix local.hex
  yes Y | LC_ALL=en_GB.UTF-8 mix local.rebar
fi

# Fetch and compile dependencies and application code (and include testing tools)
export MIX_ENV="test"
cd $HOME/$CIRCLE_PROJECT_REPONAME
mix do deps.get, deps.compile, compile
```

#### `script/ci/test.sh`

テストを実行するスクリプトである。

```bash
#!/bin/bash

export MIX_ENV="test"
export PATH="$HOME/dependencies/erlang/bin:$HOME/dependencies/elixir/bin:$PATH"

mix test
```

### junit-formatter の追加

ExUnit 単体では JUnit 形式の XML を出力できないため、[junit-formatter](https://hex.pm/packages/junit_formatter)を使う必要がある。

#### `mix.exs`の修正

`deps`関数に下記を追加する。

```elixir
{:junit_formatter, "~> 0.0.2", only: :test}
```

#### `test/test_helper.exs`の修正

`ExUnit.start`の後に下記を追加する。

```elixir
ExUnit.configure formatters: [ExUnit.CLIFormatter, JUnitFormatter]
```

#### テストの実行

この状態でテストを実行すると、実行結果が標準出力に表示され、かつ JUnit 形式の XML が出力されることになる。

```bash
$ mix test
....

Finished in 0.1 seconds (0.1s on load, 0.02s on tests)
4 tests, 0 failures

Randomized with seed 382463
$ cat _build/test/test-junit-report.xml
<?xml version="1.0"?><testsuites><testsuite errors="0" failures="0" name="Elixir.PhoenixOnHeroku.PageControllerTest" tests="1" time="20689"><testcase classname="Elixir.PhoenixOnHeroku.PageControllerTest" name="test GET /" time="20689"/></testsuite><testsuite errors="0" failures="0" name="Elixir.PhoenixOnHeroku.ErrorViewTest" tests="3" time="1458"><testcase classname="Elixir.PhoenixOnHeroku.ErrorViewTest" name="test renders 404.html" time="16"/><testcase classname="Elixir.PhoenixOnHeroku.ErrorViewTest" name="test render 500.html" time="24"/><testcase classname="Elixir.PhoenixOnHeroku.ErrorViewTest" name="test render any other" time="1418"/></testsuite></testsuites>
```

### CircleCI でテストを実行

これで CircleCI でテストを実行できようになったので、レポジトリを CircleCI のプロジェクトに追加して、テストを実行するだけである。

{{< screenshot src="20150614152157.png" >}}

## 参考

- [CircleCI elixir build example · GitHub](https://gist.github.com/joakimk/48ed80f1a7adb5f5ea27)
