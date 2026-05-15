{
  delib,
  host,
  pkgs,
  ...
}:
let
  # Pinned for Cursor / VS Code 1.105.x: open-vsx-release tracks newer nix-ide whose
  # engines.vscode exceeds 1.105 (see vscode-nix-ide releases through v0.5.7).
  nixIdeForVscode105 = pkgs.vscode-utils.buildVscodeMarketplaceExtension {
    mktplcRef = {
      publisher = "jnoortheen";
      name = "nix-ide";
      version = "0.5.7";
      hash = "sha256-6wIjuvMlA+mwg5gzctkfOAdaQLBy2K6YcV3kJxK3VOo=";
    };
    meta = {
      changelog = "https://marketplace.visualstudio.com/items/jnoortheen.nix-ide/changelog";
      description = "Nix language support with formatting and error report";
      downloadPage = "https://marketplace.visualstudio.com/items?itemName=jnoortheen.nix-ide";
      homepage = "https://github.com/nix-community/vscode-nix-ide";
      license = pkgs.lib.licenses.mit;
      maintainers = [ ];
    };
  };
in
delib.module {
  name = "programs.cursor";

  options = delib.singleEnableOption host.isDesktop;

  home.ifEnabled.programs.cursor = {
    enable = true;

    profiles.default = {
      enableUpdateCheck = false;
      enableExtensionUpdateCheck = false;

      extensions =
        (with pkgs.open-vsx-release; [
          apollographql.vscode-apollo
          christian-kohler.path-intellisense
          davidanson.vscode-markdownlint
          github.github-vscode-theme
          github.vscode-github-actions
          mkhl.shfmt
          mylesmurphy.prettify-ts
          redhat.vscode-yaml
          renesaarsoo.sql-formatter-vsc
          streetsidesoftware.code-spell-checker
          tamasfe.even-better-toml
          timonwong.shellcheck
          tyriar.sort-lines
          void-zero.vite-plus-extension-pack
          vscode-icons-team.vscode-icons
        ])
        ++ [
          nixIdeForVscode105
          pkgs.vscode-marketplace-release."3w36zj6".textlint
        ];

      userSettings = {
        "cursor.composer.usageSummaryDisplay" = "always";
        "editor.fontFamily" = "FiraCode Nerd Font";
        "editor.fontLigatures" = true;
        "editor.fontSize" = 14;
        "editor.lineHeight" = 16;
        "editor.renderLineHighlight" = "none";
        "editor.renderWhitespace" = "boundary";
        "editor.rulers" = [ 120 ];
        "editor.tabSize" = 2;
        "editor.wordWrap" = "on";
        "editor.formatOnPaste" = true;
        "editor.formatOnSave" = true;
        "editor.formatOnType" = true;
        "files.insertFinalNewline" = true;
        "files.trimTrailingWhitespace" = true;
        "workbench.activityBar.orientation" = "vertical";
        "workbench.colorTheme" = "GitHub Dark Default";
        "workbench.iconTheme" = "vscode-icons";
        "terminal.integrated.fontFamily" = "FiraCode Nerd Font";
        "terminal.integrated.fontLigatures.enabled" = true;
        "terminal.integrated.fontSize" = 14;
        "remote.autoForwardPortsSource" = "process";
        "remote.SSH.remotePlatform"."gemini" = "linux";
        "shfmt.executableArgs" = [
          "--indent"
          "2"
        ];
        "[nix]"."editor.defaultFormatter" = "jnoortheen.nix-ide";
        "[shellscript]"."editor.defaultFormatter" = "mkhl.shfmt";
        "[sql]"."editor.defaultFormatter" = "ReneSaarsoo.sql-formatter-vsc";
        "[toml]"."editor.defaultFormatter" = "tamasfe.even-better-toml";
      };
    };
  };
}
