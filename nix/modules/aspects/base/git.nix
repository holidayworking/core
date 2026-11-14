{
  den.aspects.base.homeManager = { pkgs, ... }: {
    home = {
      file.".tigrc".text = ''
        bind main R !git rebase -i %(commit)
        bind diff R !git rebase -i %(commit)
      '';

      packages = with pkgs; [
        ghq
        glab
        local.git-now
        tig
      ];
    };

    programs = {
      gh = {
        enable = true;
        settings.git_protocol = "ssh";
      };

      git = {
        enable = true;

        ignores = [
          ".DS_Store"
          ".claude/settings.local.json"
          ".codegraph"
          "docker-compose.override.yml"
        ];

        settings = {
          alias.delete-merged-branch = "!f () { git checkout $1 && git pull origin $1 && git branch --merged | grep -vE 'develop|main|master' | xargs -I % git branch -d % && git fetch --all --prune;};f";
          ghq.root = "~/src";
        };
      };
    };
  };
}
