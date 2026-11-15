---
date: 2026-11-15 09:30:00 +09:00
title: VS Code から Neovim に、tmux から herdr に移行した
tags:
  - claude-code
  - herdr
  - neovim
  - nix
---

エディターを VS Code から Neovim に、ターミナルマルチプレクサーを tmux から[herdr](https://herdr.dev)に移行した。

最近はコーディングを Claude Code に任せていて、自分でコードを書くことはほとんどなくなった。そうした中で herdr に興味を持ったが、VS Code だと Ghostty との間を行ったり来たりしなければならない。それなら、ターミナルで動く Neovim で十分だと考えた。移行の作業も、Claude Code にしてもらった。

## Neovim

Nix で Neovim を設定する方法には、[Nixvim](https://github.com/nix-community/nixvim)と[nvf](https://github.com/NotAShelf/nvf)がある。

| 観点                   | Nixvim                                                       | nvf                                                                                    |
| ---------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 設定の書き方           | プラグインの`setup()`の引数を`plugins.<name>.settings`に書く | 独自のオプションで書く（`vim.languages.nix.enable = true`で LSP や整形がまとめて入る） |
| 最初の手軽さ           | 普通                                                         | 少ない記述で IDE のような形になる                                                      |
| 標準から外れた設定     | しやすい                                                     | 用意されたオプションの外では、Lua を直接書くことになる                                 |
| 利用者と対応プラグイン | 多い                                                         | Nixvim よりは少ない                                                                    |

Neovim のプラグインの README や記事は、Lua で`setup()`を呼ぶ前提で書かれている。Nixvim なら、その引数を`settings`に書き写せばよいが、nvf では対応するオプションを毎回探すことになる。最初は nvf のほうが楽だが、自分で調整していくうちに独自のオプションが邪魔になりやすい。利用者が多く、困ったときに事例を見つけやすいこともあって、Nixvim を選んだ。

### プラグイン

Neovim のプラグインは次のものを入れている。

| プラグイン                                                            | 内容                                                |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| [conform.nvim](https://github.com/stevearc/conform.nvim)              | 保存時に整形する                                    |
| [github-nvim-theme](https://github.com/projekt0n/github-nvim-theme)   | VS Code と同じ GitHub Dark Default のカラースキーム |
| [neo-tree.nvim](https://github.com/nvim-neo-tree/neo-tree.nvim)       | ファイルツリー                                      |
| [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig)            | LSP サーバーの設定                                  |
| [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) | 構文のハイライト                                    |
| [nvim-web-devicons](https://github.com/nvim-tree/nvim-web-devicons)   | ファイルの種類ごとのアイコン                        |
| [SchemaStore.nvim](https://github.com/b0o/SchemaStore.nvim)           | jsonls と yamlls に JSON Schema を渡す              |
| [snacks.nvim](https://github.com/folke/snacks.nvim)                   | ファイルの検索と grep のピッカー                    |
| [which-key.nvim](https://github.com/folke/which-key.nvim)             | 途中まで押したキーに続くキーマップを表示する        |

#### conform.nvim

VS Code では保存時に Oxlint の安全な修正（`source.fixAll.oxc`）を当ててから Oxfmt で整形していたので、Neovim でも同じ順番にしている。Oxlint の LSP サーバーにコードアクションを問い合わせて適用し、その後で Oxfmt で整形している。

```lua
function(bufnr)
  local client = vim.lsp.get_clients({ bufnr = bufnr, name = "oxlint" })[1]
  if client then
    local params = {
      textDocument = vim.lsp.util.make_text_document_params(bufnr),
      range = {
        start = { line = 0, character = 0 },
        ["end"] = { line = vim.api.nvim_buf_line_count(bufnr), character = 0 },
      },
      context = { only = { "source.fixAll.oxc" }, diagnostics = {} },
    }
    local response = client:request_sync("textDocument/codeAction", params, 1000, bufnr)
    for _, action in ipairs(response and response.result or {}) do
      if action.edit then
        vim.lsp.util.apply_workspace_edit(action.edit, client.offset_encoding)
      end
    end
  end

  return { lsp_format = "fallback", name = "oxfmt" }
end
```

#### nvim-lspconfig

LSP サーバーは、次のものを有効にしている。

```nix
lsp.servers = {
  bashls.enable = true;
  jsonls.enable = true;
  nixd.enable = true;
  oxfmt = vpServer "fmt";
  oxlint = vpServer "lint";
  taplo.enable = true;
  tsc.enable = true;
  yamlls.enable = true;
};
```

`lsp.servers`の`oxfmt`と`oxlint`は、次の`vpServer`で設定している。どちらも、Nix で入れた LSP サーバーではなく、[Vite+](https://viteplus.dev)のプロジェクトにある`node_modules/.bin/vp`を`vp fmt --lsp`と`vp lint --lsp`として起動し、`vite.config.ts`の設定が使われるようにしている。起動するのは、`vite.config.*`と`node_modules/.bin/vp`の両方があるディレクトリーだけである。

```nix
vpServer = subcommand: {
  enable = true;
  package = null;

  config = {
    cmd.__raw = ''
      function(dispatchers, config)
        return vim.lsp.rpc.start(
          { config.root_dir .. "/node_modules/.bin/vp", "${subcommand}", "--lsp" },
          dispatchers,
          { cwd = config.root_dir }
        )
      end
    '';

    root_dir.__raw = ''
      function(bufnr, on_dir)
        local root = vim.fs.root(bufnr, {
          "vite.config.cjs",
          "vite.config.cts",
          "vite.config.js",
          "vite.config.mjs",
          "vite.config.mts",
          "vite.config.ts",
        })
        if root and vim.fn.executable(root .. "/node_modules/.bin/vp") == 1 then
          on_dir(root)
        end
      end
    '';
  };
};
```

## herdr

herdr は AI のコーディングエージェント向けのターミナルワークスペースマネージャーで、tmux のようにペインやタブを分けられるうえに、各ペインで動いているエージェントの状態（作業中、入力待ち、完了など）を表示してくれる。

Ghostty は、最初のウィンドウで herdr へつなぐようにしている。GUI から起動した Ghostty の環境変数のまま herdr のサーバーを起動すると、PATH が足りずにプラグインの動かないことがあるので、ログインシェルを経由している。

```nix
initial-command = "${lib.getExe pkgs.zsh} -lc 'exec herdr'";
```

### プラグイン

herdr のプラグインは次のものを入れている。

| プラグイン                                                                | 内容                                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [herdr-nvim](https://github.com/ChmaraX/herdr-nvim)                       | Neovim をサイドバーに開き、エージェントが触ったファイルを選んで開ける |
| [herdr-gitview](https://github.com/ChmaraX/herdr-gitview)                 | Git の差分をサイドバーかタブで表示する                                |
| [herdr-terminal-notifier](https://github.com/dot/herdr-terminal-notifier) | エージェントの状態が変わったときに macOS の通知を出す（macOS のみ）   |

どれも nixpkgs にはないので、nvfetcher でソースを追いかけ、自分でパッケージにしている。herdr-nvim と herdr-gitview は Rust で書かれているので`buildRustPackage`でビルドしている。どちらも統合テストは herdr 本体や実際のターミナルを必要とし、Nix のサンドボックスでは動かないので、単体テストだけを実行している。

プラグインは`herdr plugin link <ディレクトリー>`で登録すると、herdr が`~/.config/herdr/plugins.json`に記録する。このファイルは herdr 自身も書き換えるので、Nix で管理することはせず、Home Manager の activation で毎回`herdr plugin link`を実行している。そのために`programs.herdr.plugins`というオプションを自分で定義している。Nix のストアから登録されたプラグインのうち、設定から外したものは`herdr plugin unlink`で外している。herdr のコマンドが失敗しても、警告を出すだけで activation は止めないようにしている。

```nix
home.activation.herdrPlugins = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
  ${lib.concatMapStrings (plugin: ''
    run ${herdr} plugin link ${plugin} >/dev/null \
      || warnEcho "herdr: failed to link ${plugin}"
  '') plugins}
  plugins_json=${lib.escapeShellArg "${config.xdg.configHome}/herdr/plugins.json"}
  if [ -f "$plugins_json" ]; then
    stale=$(${lib.getExe pkgs.jq} -r \
      --argjson keep ${lib.escapeShellArg (builtins.toJSON (map toString plugins))} \
      '.[] | select(.plugin_root | startswith("/nix/store/"))
        | select(.plugin_root as $root | $keep | index($root) | not)
        | .plugin_id' "$plugins_json") \
      || warnEcho "herdr: failed to read $plugins_json"
    for id in $stale; do
      run ${herdr} plugin unlink "$id" >/dev/null \
        || warnEcho "herdr: failed to unlink $id"
    done
  fi
'';
```

### Claude Code との連携

herdr は Claude Code の状態をフックで受け取る。本来は`herdr integration install claude`を実行すると、フックのスクリプトが`~/.claude/hooks/`に置かれ、`~/.claude/settings.json`にフックが登録される。しかし、Claude Code の`settings.json`は Home Manager で管理していて読み取り専用なので、このコマンドは使えない。

そこで、Nix のビルドの中で一時ディレクトリーに向けて`herdr integration install claude`を実行し、できたフックのスクリプトを Home Manager の`programs.claude-code.hooks`で置いている。`settings.json`に書くフックの設定は、herdr が書くものと同じ内容を Nix で書いている。

このスクリプトは中で python3 を使っていて、PATH に python3 がないと、エラーも出さずに何もしないで終わってしまう。python3 が入っていない環境もあるので、スクリプトの中の`python3`を Nix のストアのパスに置き換えている。

```nix
herdrClaudeIntegration = pkgs.runCommand "herdr-claude-integration" { } ''
  mkdir -p $out
  echo '{}' > $out/settings.json
  HOME=$TMPDIR CLAUDE_CONFIG_DIR=$out ${lib.getExe config.programs.herdr.package} integration install claude
  substituteInPlace $out/hooks/herdr-agent-state.sh \
    --replace-fail "command -v python3" "command -v ${lib.getExe pkgs.python3}" \
    --replace-fail "python3 - <<" "${lib.getExe pkgs.python3} - <<"
'';
```
