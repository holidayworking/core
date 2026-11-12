{
  den.aspects.base.homeManager.programs.tmux = {
    enable = true;
    customPaneNavigationAndResize = true;

    extraConfig = ''
      bind s split-window -v -c "#{pane_current_path}"
      bind v split-window -h -c "#{pane_current_path}"

      bind < resize-pane -L 1
      bind > resize-pane -R 1
      bind - resize-pane -D 1
      bind + resize-pane -U 1
    '';

    keyMode = "vi";
    prefix = "C-t";
    terminal = "screen-256color";
  };
}
