{ delib, ... }:
delib.module {
  name = "programs.git";

  home.always.programs.git = {
    enable = true;
    ignores = [ ".DS_Store" ];

    settings = {
      alias.delete-merged-branch = "!f () { git checkout $1 && git pull origin $1 && git branch --merged | grep -vE 'develop|main|master' | xargs -I % git branch -d % && git fetch --all --prune;};f";
      core.editor = "vim";
      ghq.root = "~/src";

      user = {
        name = "Hidekazu Tanaka";
        email = "11025+holidayworking@users.noreply.github.com";
      };
    };
  };
}
