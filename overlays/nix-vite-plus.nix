{ delib, inputs, ... }:
delib.overlayModule {
  name = "nix-vite-plus";
  overlay =
    final: prev:
    let
      upstream = inputs.nix-vite-plus.overlays.default final prev;
    in
    upstream
    // {
      vite-plus = upstream.vite-plus.overrideAttrs (old: {
        doInstallCheck = !(prev.stdenv.hostPlatform.isAarch64 && prev.stdenv.hostPlatform.isLinux);
        pnpmDeps = old.pnpmDeps.override {
          hash = "sha256-OhIMDP9Ls/stkOt8NplG9KfMU/T8U39N6kh8xpZ4pqk=";
        };
        nativeBuildInputs = prev.lib.subtractLists [ prev.pnpm_10 ] old.nativeBuildInputs ++ [ prev.pnpm ];
      });
    };
}
