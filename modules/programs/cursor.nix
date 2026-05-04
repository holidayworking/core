{
  delib,
  host,
  mcpServers,
  inputs,
  pkgs,
  ...
}:
delib.module {
  name = "programs.cursor";

  home.always = {
    home = {
      packages = with pkgs; [
        llm-agents.cursor-agent
      ];

      file.".cursor/mcp.json".source = inputs.mcp-servers-nix.lib.mkConfig pkgs mcpServers;
    };

    programs.vscode = {
      enable = host.isDesktop;
      package = pkgs.code-cursor;

      profiles.default = {
        enableUpdateCheck = false;
        enableExtensionUpdateCheck = false;

        extensions =
          (with pkgs.open-vsx-release; [
            apollographql.vscode-apollo
            christian-kohler.path-intellisense
            davidanson.vscode-markdownlint
            eamodio.gitlens
            github.github-vscode-theme
            github.vscode-github-actions
            hashicorp.terraform
            jnoortheen.nix-ide
            mkhl.shfmt
            mylesmurphy.prettify-ts
            redhat.vscode-yaml
            renesaarsoo.sql-formatter-vsc
            streetsidesoftware.code-spell-checker
            timonwong.shellcheck
            tyriar.sort-lines
            void-zero.vite-plus-extension-pack
            vscode-icons-team.vscode-icons
          ])
          ++ [ pkgs.vscode-marketplace-release."3w36zj6".textlint ];

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
          "gitlens.rebaseEditor.openOnPausedRebase" = false;
          "remote.SSH.remotePlatform"."gemini" = "linux";
          "shfmt.executableArgs" = [
            "--indent"
            "2"
          ];
          "[nix]"."editor.defaultFormatter" = "jnoortheen.nix-ide";
          "[shellscript]"."editor.defaultFormatter" = "mkhl.shfmt";
          "[sql]"."editor.defaultFormatter" = "ReneSaarsoo.sql-formatter-vsc";
          "[terraform]"."editor.defaultFormatter" = "hashicorp.terraform";
        };
      };
    };
  };
}
