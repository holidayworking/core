{ inputs, ... }:
let
  # Run Oxc's language servers through the project's Vite+, so they use its
  # Oxlint/Oxfmt versions and the `lint`/`fmt` blocks in vite.config.ts.
  # Attach only where a vite.config.* and node_modules/.bin/vp both exist.
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
in
{
  flake-file.inputs.nixvim = {
    url = "github:nix-community/nixvim";

    inputs = {
      flake-parts.follows = "flake-parts";
      nixpkgs.follows = "nixpkgs";
    };
  };

  den.aspects.base.homeManager = { pkgs, ... }: {
    imports = [ inputs.nixvim.homeModules.nixvim ];

    programs.nixvim = { config, ... }: {
      enable = true;
      defaultEditor = true;
      clipboard.register = "unnamedplus";
      colorscheme = "github_dark_default";
      colorschemes.github-theme.enable = true;
      dependencies.ripgrep.enable = true;
      extraConfigLua = ''require("herdr-nvim").setup({})'';

      # Used by bashls.
      extraPackages = [ pkgs.shellcheck ];

      extraPlugins = [ pkgs.local.herdr-nvim ];

      globals.mapleader = " ";

      keymaps = [
        {
          action.__raw = "function() Snacks.picker.grep() end";
          key = "<leader>/";
          options.desc = "Grep";
        }
        {
          action.__raw = "function() Snacks.picker.files() end";
          key = "<leader><space>";
          options.desc = "Find files";
        }
        {
          action = "<cmd>Neotree toggle<cr>";
          key = "<leader>e";
          options.desc = "Toggle file tree";
        }
      ];

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

      opts = {
        expandtab = true;
        ignorecase = true;
        number = true;
        shiftwidth = 2;
        signcolumn = "yes";
        smartcase = true;
        tabstop = 2;
        undofile = true;
      };

      plugins = {
        conform-nvim = {
          enable = true;
          autoInstall.enable = true;

          settings = {
            # Apply Oxlint's safe fixes (the `source.fixAll.oxc` code action)
            # before formatting on save.
            format_on_save.__raw = ''
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

                -- Oxfmt is the only LSP formatter, as in `vp fmt`; other servers
                -- (tsc, jsonls, yamlls, taplo) would format differently.
                return { lsp_format = "fallback", name = "oxfmt" }
              end
            '';

            formatters.shfmt.prepend_args = [
              "--indent"
              "2"
            ];

            formatters_by_ft = {
              nix = [ "nixfmt" ];
              sh = [ "shfmt" ];
            };
          };
        };

        lspconfig.enable = true;

        neo-tree = {
          enable = true;

          settings = {
            close_if_last_window = true;

            filesystem = {
              follow_current_file.enabled = true;
              use_libuv_file_watcher = true;
            };
          };
        };

        schemastore.enable = true;

        snacks = {
          enable = true;
          settings.picker.enabled = true;
        };

        treesitter = {
          enable = true;

          grammarPackages = with config.plugins.treesitter.package.builtGrammars; [
            bash
            css
            diff
            dockerfile
            git_rebase
            gitcommit
            html
            javascript
            json
            lua
            make
            markdown
            markdown_inline
            nix
            toml
            tsx
            typescript
            yaml
          ];

          highlight.enable = true;
        };

        web-devicons.enable = true;
        which-key.enable = true;
      };

      viAlias = true;
      vimAlias = true;
    };
  };
}
