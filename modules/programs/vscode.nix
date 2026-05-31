{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.vscode";

  options = delib.singleEnableOption host.isDesktop;

  home.ifEnabled.programs.vscode = {
    enable = true;

    profiles.default = {
      enableUpdateCheck = false;
      enableExtensionUpdateCheck = false;

      extensions =
        (with pkgs.vscode-marketplace-release; [
          anthropic.claude-code
          apollographql.vscode-apollo
          christian-kohler.path-intellisense
          davidanson.vscode-markdownlint
          github.github-vscode-theme
          github.vscode-github-actions
          jnoortheen.nix-ide
          mkhl.shfmt
          ms-vscode-remote.vscode-remote-extensionpack
          mylesmurphy.prettify-ts
          openai.chatgpt
          redhat.vscode-yaml
          renesaarsoo.sql-formatter-vsc
          streetsidesoftware.code-spell-checker
          tamasfe.even-better-toml
          timonwong.shellcheck
          tyriar.sort-lines
          voidzero.vite-plus-extension-pack
          vscode-icons-team.vscode-icons
        ])
        ++ [
          pkgs.vscode-marketplace-release."3w36zj6".textlint
        ];

      userSettings = {
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
        "editor.minimap.enabled" = false;
        "files.insertFinalNewline" = true;
        "files.trimTrailingWhitespace" = true;
        "workbench.startupEditor" = "none";
        "workbench.colorTheme" = "GitHub Dark Default";
        "workbench.iconTheme" = "vscode-icons";
        "terminal.integrated.fontFamily" = "FiraCode Nerd Font";
        "terminal.integrated.fontLigatures.enabled" = true;
        "terminal.integrated.fontSize" = 14;
        "remote.autoForwardPortsSource" = "process";
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
