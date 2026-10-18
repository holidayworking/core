{
  delib,
  host,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "programs.vscode";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled = {
    home.packages = with pkgs; [
      nixd
      nixfmt
    ];
    programs.vscode = {
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
            long-kudo.vscode-claude-status
            mkhl.shfmt
            ms-vscode-remote.vscode-remote-extensionpack
            mylesmurphy.prettify-ts
            redhat.vscode-yaml
            renesaarsoo.sql-formatter-vsc
            singularityinc.claude-notifier
            streetsidesoftware.code-spell-checker
            tamasfe.even-better-toml
            # 0.43.0 turned `contributes.configuration` into an array, which breaks the
            # upstream postInstall that assumes an object.
            (timonwong.shellcheck.overrideAttrs {
              postInstall = ''
                cd "$out/$installPrefix"
                jq '(.contributes.configuration[] | select(.properties | has("shellcheck.executablePath")) | .properties."shellcheck.executablePath".default) = "${pkgs.lib.getExe pkgs.shellcheck}"' package.json | sponge package.json
              '';
            })
            tyriar.sort-lines
            voidzero.vite-plus-extension-pack
            vscode-icons-team.vscode-icons
          ])
          ++ [
            pkgs.vscode-marketplace-release."3w36zj6".textlint
          ];

        # Mirror the macOS default keymap on Linux. xremap leaves VSCode alone (see
        # services/xremap.nix), so Super reaches VSCode as `meta` and stands in for Cmd here.
        # Later entries take precedence, so context-specific overrides follow the generic ones.
        keybindings = lib.optionals host.isLinux [
          # Clipboard and undo
          {
            key = "meta+x";
            command = "editor.action.clipboardCutAction";
          }
          {
            key = "meta+c";
            command = "editor.action.clipboardCopyAction";
          }
          {
            key = "meta+c";
            command = "workbench.action.terminal.copySelection";
            when = "terminalFocus && terminalTextSelected";
          }
          {
            key = "meta+v";
            command = "editor.action.clipboardPasteAction";
          }
          {
            key = "meta+v";
            command = "workbench.action.terminal.paste";
            when = "terminalFocus";
          }
          {
            key = "meta+z";
            command = "undo";
          }
          {
            key = "shift+meta+z";
            command = "redo";
          }

          # Selection
          {
            key = "meta+a";
            command = "editor.action.selectAll";
          }
          {
            key = "meta+a";
            command = "workbench.action.terminal.selectAll";
            when = "terminalFocus";
          }
          {
            key = "meta+l";
            command = "expandLineSelection";
            when = "textInputFocus";
          }
          {
            key = "meta+d";
            command = "editor.action.addSelectionToNextFindMatch";
            when = "editorFocus";
          }
          {
            key = "shift+meta+l";
            command = "editor.action.selectHighlights";
            when = "editorFocus";
          }

          # Cursor movement (Emacs-style ctrl keys are what macOS provides in text inputs)
          {
            key = "ctrl+a";
            command = "cursorLineStart";
            when = "textInputFocus";
          }
          {
            key = "ctrl+e";
            command = "cursorLineEnd";
            when = "textInputFocus";
          }
          {
            key = "ctrl+b";
            command = "cursorLeft";
            when = "textInputFocus";
          }
          {
            key = "ctrl+f";
            command = "cursorRight";
            when = "textInputFocus";
          }
          {
            key = "ctrl+p";
            command = "cursorUp";
            when = "textInputFocus";
          }
          {
            key = "ctrl+p";
            command = "selectPrevSuggestion";
            when = "suggestWidgetMultipleSuggestions && suggestWidgetVisible && textInputFocus";
          }
          {
            key = "ctrl+p";
            command = "workbench.action.quickOpenSelectPrevious";
            when = "inQuickOpen";
          }
          {
            key = "ctrl+n";
            command = "cursorDown";
            when = "textInputFocus";
          }
          {
            key = "ctrl+n";
            command = "selectNextSuggestion";
            when = "suggestWidgetMultipleSuggestions && suggestWidgetVisible && textInputFocus";
          }
          {
            key = "ctrl+n";
            command = "workbench.action.quickOpenSelectNext";
            when = "inQuickOpen";
          }
          {
            key = "meta+left";
            command = "cursorHome";
            when = "textInputFocus";
          }
          {
            key = "meta+left";
            command = "workbench.action.terminal.sendSequence";
            args.text = builtins.fromJSON ''"\u0001"'';
            when = "terminalFocus";
          }
          {
            key = "meta+right";
            command = "cursorEnd";
            when = "textInputFocus";
          }
          {
            key = "meta+right";
            command = "workbench.action.terminal.sendSequence";
            args.text = builtins.fromJSON ''"\u0005"'';
            when = "terminalFocus";
          }
          {
            key = "meta+up";
            command = "cursorTop";
            when = "textInputFocus";
          }
          {
            key = "meta+up";
            command = "workbench.action.terminal.scrollToPreviousCommand";
            when = "terminalFocus";
          }
          {
            key = "meta+down";
            command = "cursorBottom";
            when = "textInputFocus";
          }
          {
            key = "meta+down";
            command = "workbench.action.terminal.scrollToNextCommand";
            when = "terminalFocus";
          }
          {
            key = "shift+meta+left";
            command = "cursorHomeSelect";
            when = "textInputFocus";
          }
          {
            key = "shift+meta+right";
            command = "cursorEndSelect";
            when = "textInputFocus";
          }
          {
            key = "shift+meta+up";
            command = "cursorTopSelect";
            when = "textInputFocus";
          }
          {
            key = "shift+meta+down";
            command = "cursorBottomSelect";
            when = "textInputFocus";
          }
          {
            key = "alt+left";
            command = "cursorWordLeft";
            when = "textInputFocus";
          }
          {
            key = "alt+left";
            command = "workbench.action.terminal.sendSequence";
            args.text = builtins.fromJSON ''"\u001bb"'';
            when = "terminalFocus";
          }
          {
            key = "alt+right";
            command = "cursorWordEndRight";
            when = "textInputFocus";
          }
          {
            key = "alt+right";
            command = "workbench.action.terminal.sendSequence";
            args.text = builtins.fromJSON ''"\u001bf"'';
            when = "terminalFocus";
          }
          {
            key = "shift+alt+left";
            command = "cursorWordLeftSelect";
            when = "textInputFocus";
          }
          {
            key = "shift+alt+right";
            command = "cursorWordEndRightSelect";
            when = "textInputFocus";
          }

          # Deletion
          {
            key = "ctrl+h";
            command = "deleteLeft";
            when = "textInputFocus && !editorReadonly";
          }
          {
            key = "ctrl+d";
            command = "deleteRight";
            when = "textInputFocus && !editorReadonly";
          }
          {
            key = "ctrl+k";
            command = "deleteAllRight";
            when = "textInputFocus && !editorReadonly";
          }
          {
            key = "meta+backspace";
            command = "deleteAllLeft";
            when = "textInputFocus && !editorReadonly";
          }
          {
            key = "meta+backspace";
            command = "workbench.action.terminal.sendSequence";
            args.text = builtins.fromJSON ''"\u0015"'';
            when = "terminalFocus";
          }
          {
            key = "meta+delete";
            command = "deleteAllRight";
            when = "textInputFocus && !editorReadonly";
          }
          {
            key = "alt+backspace";
            command = "deleteWordLeft";
            when = "textInputFocus && !editorReadonly";
          }
          {
            key = "alt+delete";
            command = "deleteWordRight";
            when = "textInputFocus && !editorReadonly";
          }

          # Line editing
          {
            key = "meta+/";
            command = "editor.action.commentLine";
            when = "editorTextFocus && !editorReadonly";
          }
          {
            key = "meta+]";
            command = "editor.action.indentLines";
            when = "editorTextFocus && !editorReadonly";
          }
          {
            key = "meta+[";
            command = "editor.action.outdentLines";
            when = "editorTextFocus && !editorReadonly";
          }
          {
            key = "meta+enter";
            command = "editor.action.insertLineAfter";
            when = "editorTextFocus && !editorReadonly";
          }
          {
            key = "shift+meta+enter";
            command = "editor.action.insertLineBefore";
            when = "editorTextFocus && !editorReadonly";
          }
          {
            key = "shift+meta+k";
            command = "editor.action.deleteLines";
            when = "textInputFocus && !editorReadonly";
          }

          # Find
          {
            key = "meta+f";
            command = "actions.find";
          }
          {
            key = "meta+f";
            command = "workbench.action.terminal.focusFind";
            when = "terminalFocus";
          }
          # Let ctrl+f reach the shell (forward-char) instead of opening terminal find.
          {
            key = "ctrl+f";
            command = "-workbench.action.terminal.focusFind";
          }
          {
            key = "meta+g";
            command = "editor.action.nextMatchFindAction";
            when = "editorFocus";
          }
          {
            key = "meta+g";
            command = "workbench.action.terminal.findNext";
            when = "terminalFindFocused || terminalFocus";
          }
          {
            key = "shift+meta+g";
            command = "editor.action.previousMatchFindAction";
            when = "editorFocus";
          }
          {
            key = "shift+meta+g";
            command = "workbench.action.terminal.findPrevious";
            when = "terminalFindFocused || terminalFocus";
          }
          {
            key = "alt+meta+f";
            command = "editor.action.startFindReplaceAction";
          }
          {
            key = "shift+meta+f";
            command = "workbench.action.findInFiles";
          }
          {
            key = "shift+meta+h";
            command = "workbench.action.replaceInFiles";
          }

          # Files and editors
          {
            key = "meta+n";
            command = "workbench.action.files.newUntitledFile";
          }
          {
            key = "shift+meta+n";
            command = "workbench.action.newWindow";
          }
          # macOS opens files and folders from one dialog (openFileFolder), which VSCode only offers there.
          {
            key = "meta+o";
            command = "workbench.action.files.openFile";
          }
          {
            key = "meta+s";
            command = "workbench.action.files.save";
          }
          {
            key = "shift+meta+s";
            command = "workbench.action.files.saveAs";
          }
          {
            key = "meta+w";
            command = "workbench.action.closeActiveEditor";
          }
          {
            key = "meta+w";
            command = "workbench.action.closeWindow";
            when = "!editorIsOpen && !multipleEditorGroups";
          }
          {
            key = "shift+meta+t";
            command = "workbench.action.reopenClosedEditor";
          }
          {
            key = "shift+meta+[";
            command = "workbench.action.previousEditor";
          }
          {
            key = "shift+meta+]";
            command = "workbench.action.nextEditor";
          }
          {
            key = "meta+\\";
            command = "workbench.action.splitEditor";
          }
          {
            key = "meta+1";
            command = "workbench.action.focusFirstEditorGroup";
          }
          {
            key = "meta+2";
            command = "workbench.action.focusSecondEditorGroup";
          }
          {
            key = "meta+3";
            command = "workbench.action.focusThirdEditorGroup";
          }

          # Navigation and views
          {
            key = "meta+p";
            command = "workbench.action.quickOpen";
          }
          {
            key = "shift+meta+p";
            command = "workbench.action.showCommands";
          }
          {
            key = "meta+t";
            command = "workbench.action.showAllSymbols";
          }
          {
            key = "meta+,";
            command = "workbench.action.openSettings";
          }
          {
            key = "meta+b";
            command = "workbench.action.toggleSidebarVisibility";
          }
          {
            key = "meta+0";
            command = "workbench.action.focusSideBar";
          }
          {
            key = "meta+j";
            command = "workbench.action.togglePanel";
          }
          {
            key = "shift+meta+e";
            command = "workbench.view.explorer";
          }
          {
            key = "shift+meta+x";
            command = "workbench.view.extensions";
          }
          {
            key = "shift+meta+m";
            command = "workbench.actions.view.problems";
          }
          {
            key = "shift+meta+u";
            command = "workbench.action.output.toggleOutput";
          }
          {
            key = "meta+=";
            command = "workbench.action.zoomIn";
          }
          {
            key = "meta+-";
            command = "workbench.action.zoomOut";
          }
          {
            key = "meta+numpad0";
            command = "workbench.action.zoomReset";
          }

          # Cmd+K chords; the terminal binds plain Cmd+K to clear, as on macOS
          {
            key = "meta+k meta+s";
            command = "workbench.action.openGlobalKeybindings";
          }
          {
            key = "meta+k meta+t";
            command = "workbench.action.selectTheme";
          }
          {
            key = "meta+k meta+w";
            command = "workbench.action.closeAllEditors";
          }
          {
            key = "meta+k meta+c";
            command = "editor.action.addCommentLine";
            when = "editorTextFocus && !editorReadonly";
          }
          {
            key = "meta+k meta+u";
            command = "editor.action.removeCommentLine";
            when = "editorTextFocus && !editorReadonly";
          }
          {
            key = "meta+k meta+f";
            command = "editor.action.formatSelection";
            when = "editorTextFocus && !editorReadonly";
          }
          {
            key = "meta+k meta+0";
            command = "editor.foldAll";
            when = "editorTextFocus";
          }
          {
            key = "meta+k meta+j";
            command = "editor.unfoldAll";
            when = "editorTextFocus";
          }
          {
            key = "meta+k v";
            command = "markdown.showPreviewToSide";
            when = "editorLangId == 'markdown'";
          }
          {
            key = "meta+k z";
            command = "workbench.action.toggleZenMode";
          }
          {
            key = "meta+k";
            command = "workbench.action.terminal.clear";
            when = "terminalFocus";
          }
        ];

        userSettings = {
          "editor.fontFamily" = "Firple";
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
          "window.menuBarVisibility" = "visible";
          "workbench.startupEditor" = "none";
          "workbench.colorTheme" = "GitHub Dark Default";
          "workbench.iconTheme" = "vscode-icons";
          "chat.disableAIFeatures" = true;
          "terminal.integrated.fontFamily" = "Firple";
          "terminal.integrated.fontLigatures.enabled" = true;
          "terminal.integrated.fontSize" = 14;
          "claudeCode.claudeProcessWrapper" = pkgs.lib.getExe' pkgs.llm-agents.claude-code "claude";
          "claudeCode.initialPermissionMode" = "auto";
          "claudeCode.preferredLocation" = "panel";
          "claudeCode.useCtrlEnterToSend" = true;
          "claudeNotifier.autoMuteWhenFocused" = true;
          "nix.enableLanguageServer" = true;
          "nix.hiddenLanguageServerErrors" = [ "textDocument/definition" ];
          "nix.serverPath" = "nixd";
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
  };
}
