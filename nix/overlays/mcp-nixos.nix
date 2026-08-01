{ delib, ... }:
delib.overlayModule {
  name = "mcp-nixos";
  targets = [ "home" ];
  overlay = _final: prev: {
    # TODO: remove once test_read_text_file passes upstream
    # The test picks an arbitrary small text file from /nix/store to
    # exercise the "read" tool, and fails whenever that file happens to
    # contain the substring "Error" (e.g. a minified JS asset) — a flaky
    # assumption that depends on the build sandbox's store contents.
    mcp-nixos = prev.mcp-nixos.overridePythonAttrs (old: {
      disabledTests = old.disabledTests ++ [ "test_read_text_file" ];
    });
  };
}
