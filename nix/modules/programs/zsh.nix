{
  delib,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "programs.zsh";

  nixos.always.programs.zsh.enable = true;

  home.always.programs = {
    eza = {
      enable = true;
      enableZshIntegration = false;
    };

    sheldon = {
      enable = true;

      settings = {
        shell = "zsh";

        plugins = {
          ls.github = "zpm-zsh/ls";
          "zsh-autosuggestions".github = "zsh-users/zsh-autosuggestions";
          "zsh-completions".github = "zsh-users/zsh-completions";
          "zsh-syntax-highlighting".github = "zsh-users/zsh-syntax-highlighting";
        };
      };
    };

    starship = {
      enable = true;
      settings = {
        "$schema" = "https://starship.rs/config-schema.json";

        format = "$username$hostname$directory$git_branch$git_state$git_status$cmd_duration$line_break$character";

        directory.style = "blue";

        character = {
          success_symbol = "[❯](purple)";
          error_symbol = "[❯](red)";
          vimcmd_symbol = "[❮](green)";
        };

        git_branch = {
          format = "[$branch]($style)";
          style = "bright-black";
        };

        git_status = {
          format = "[[(*$conflicted$untracked$modified$staged$renamed$deleted)](218) ($ahead_behind$stashed)]($style)";
          style = "cyan";
          conflicted = "​";
          untracked = "​";
          modified = "​";
          staged = "​";
          renamed = "​";
          deleted = "​";
          stashed = "≡";
        };

        git_state = {
          format = ''\([$state( $progress_current/$progress_total)]($style)\) '';
          style = "bright-black";
        };

        cmd_duration = {
          format = "[$duration]($style) ";
          style = "yellow";
        };
      };
    };

    zsh = {
      enable = true;
      defaultKeymap = "emacs";

      completionInit = ''
        autoload -U compinit && compinit
        autoload -U bashcompinit && bashcompinit
      '';

      history = {
        expireDuplicatesFirst = true;
        extended = true;
        findNoDups = true;
        ignoreAllDups = true;
        saveNoDups = true;
        share = true;
      };

      initContent = ''
        zstyle ':completion:*:default' menu select=1

        function peco_select_history() {
          BUFFER=$(\history -n -r 1 | ${lib.getExe pkgs.peco} --query "$LBUFFER")
          CURSOR=$#BUFFER
          zle clear-screen
        }
        zle -N peco_select_history

        function peco_select_ghq_repository() {
          local line
          line=$(${lib.getExe pkgs.ghq} list | ${lib.getExe pkgs.peco} --query "$LBUFFER")
          if [[ -n "$line" ]]; then
            cd "$(${lib.getExe pkgs.ghq} list --full-path --exact "$line")" || return
            zle reset-prompt
          fi
        }
        zle -N peco_select_ghq_repository

        bindkey '^g' peco_select_ghq_repository
        bindkey '^r' peco_select_history
      '';

      setOptions = [
        "AUTO_MENU"
        "AUTO_LIST"
      ];
    };
  };
}
