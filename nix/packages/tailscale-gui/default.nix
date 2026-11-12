{ sources, tailscale-gui, ... }:
# nixpkgs lags behind upstream releases, so only bump the source to the
# version tracked by nvfetcher and reuse the nixpkgs build.
tailscale-gui.overrideAttrs {
  inherit (sources.tailscale-gui) version src;

  # Since 1.104, the payload holds Tailscale.app itself instead of its
  # Contents directory.
  installPhase = ''
    runHook preInstall
    xar -xf $src
    cd Distribution.pkg
    pbzx -n Payload | cpio -i

    mkdir -p $out/Applications $out/bin
    cp -R Tailscale.app $out/Applications/
    ln -s "$out/Applications/Tailscale.app/Contents/MacOS/Tailscale" "$out/bin/tailscale"

    runHook postInstall
  '';
}
