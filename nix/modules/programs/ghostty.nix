{
  delib,
  host,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "programs.ghostty";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled.programs.ghostty = {
    enable = true;
    package = if host.isDarwin then pkgs.ghostty-bin else pkgs.ghostty;

    enableZshIntegration = false;

    settings = {
      font-family = "Firple";
      font-size = "14";
      theme = "GitHub Dark Default";
      shell-integration-features = "no-path,ssh-env,ssh-terminfo";

      # Mirror Ghostty's macOS default keybinds (Cmd -> Super) on Linux.
      keybind = lib.mkIf host.isLinux [
        "clear"
        "super+shift+,=reload_config"
        "super+,=open_config"
        "copy=copy_to_clipboard:mixed"
        "paste=paste_from_clipboard"
        "performable:super+c=copy_to_clipboard:mixed"
        "performable:super+v=paste_from_clipboard"
        "super+shift+v=paste_from_selection"
        "super+==increase_font_size:1"
        "super++=increase_font_size:1"
        "super+-=decrease_font_size:1"
        "super+0=reset_font_size"
        "super+ctrl+shift+j=write_screen_file:copy,plain"
        "super+shift+j=write_screen_file:paste,plain"
        "super+shift+alt+j=write_screen_file:open,plain"
        "performable:shift+arrow_left=adjust_selection:left"
        "performable:shift+arrow_right=adjust_selection:right"
        "performable:shift+arrow_up=adjust_selection:up"
        "performable:shift+arrow_down=adjust_selection:down"
        "performable:shift+page_up=adjust_selection:page_up"
        "performable:shift+page_down=adjust_selection:page_down"
        "performable:shift+home=adjust_selection:home"
        "performable:shift+end=adjust_selection:end"
        "ctrl+shift+tab=previous_tab"
        "ctrl+tab=next_tab"
        "super+1=goto_tab:1"
        "super+2=goto_tab:2"
        "super+3=goto_tab:3"
        "super+4=goto_tab:4"
        "super+5=goto_tab:5"
        "super+6=goto_tab:6"
        "super+7=goto_tab:7"
        "super+8=goto_tab:8"
        "super+9=last_tab"
        "super+enter=toggle_fullscreen"
        "super+ctrl+f=toggle_fullscreen"
        "super+shift+enter=toggle_split_zoom"
        "super+shift+p=toggle_command_palette"
        "super+q=quit"
        "performable:super+k=clear_screen"
        "super+a=select_all"
        "performable:super+shift+t=undo"
        "performable:super+z=undo"
        "performable:super+shift+z=redo"
        "super+home=scroll_to_top"
        "super+end=scroll_to_bottom"
        "super+page_up=scroll_page_up"
        "super+page_down=scroll_page_down"
        "performable:super+j=scroll_to_selection"
        "super+arrow_up=jump_to_prompt:-1"
        "super+arrow_down=jump_to_prompt:1"
        "super+shift+arrow_up=jump_to_prompt:-1"
        "super+shift+arrow_down=jump_to_prompt:1"
        "super+n=new_window"
        "super+w=close_surface"
        "super+alt+w=close_tab:this"
        "super+shift+w=close_window"
        "super+shift+alt+w=close_all_windows"
        "super+t=new_tab"
        "super+shift+[=previous_tab"
        "super+shift+]=next_tab"
        "super+d=new_split:right"
        "super+shift+d=new_split:down"
        "super+[=goto_split:previous"
        "super+]=goto_split:next"
        "super+alt+arrow_up=goto_split:up"
        "super+alt+arrow_down=goto_split:down"
        "super+alt+arrow_left=goto_split:left"
        "super+alt+arrow_right=goto_split:right"
        "super+ctrl+arrow_up=resize_split:up,10"
        "super+ctrl+arrow_down=resize_split:down,10"
        "super+ctrl+arrow_left=resize_split:left,10"
        "super+ctrl+arrow_right=resize_split:right,10"
        "super+ctrl+==equalize_splits"
        "performable:super+f=start_search"
        "performable:super+e=search_selection"
        "performable:super+shift+f=end_search"
        "performable:escape=end_search"
        "performable:super+g=navigate_search:next"
        "performable:super+shift+g=navigate_search:previous"
        "super+alt+i=inspector:toggle"
        "super+arrow_left=text:\\x01"
        "super+arrow_right=text:\\x05"
        "super+backspace=text:\\x15"
        "alt+arrow_left=esc:b"
        "alt+arrow_right=esc:f"
      ];
    };
  };
}
