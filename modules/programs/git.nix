{ delib, ... }:
delib.module {
  name = "programs.git";

  home.always =
    { myconfig, ... }:
    let
      inherit (myconfig.constants) userfullname useremail;
    in
    {
      programs.git = {
        enable = true;
        ignores = [
          ".DS_Store"
          ".claude/settings.local.json"
        ];

        settings = {
          alias.delete-merged-branch = "!f () { git checkout $1 && git pull origin $1 && git branch --merged | grep -vE 'develop|main|master' | xargs -I % git branch -d % && git fetch --all --prune;};f";
          core.editor = "vim";
          ghq.root = "~/src";

          user = {
            name = userfullname;
            email = useremail;
          };
        };
      };
    };
}
