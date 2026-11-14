{
  jq,
  lib,
  sources,
  stdenvNoCC,
  ...
}:
stdenvNoCC.mkDerivation {
  inherit (sources.herdr-terminal-notifier) pname src;

  version = "0-unstable-${sources.herdr-terminal-notifier.date}";

  # The plugin runs from its own directory (`herdr plugin link`), and the bundled
  # HerdrNotify.app must keep its code signature, so copy the tree unchanged.
  dontFixup = true;

  # jq is the plugin's only runtime dependency; don't rely on herdr's PATH.
  installPhase = ''
    runHook preInstall
    mkdir -p $out
    cp -r assets bin herdr-plugin.toml lib $out/
    substituteInPlace $out/bin/notify.sh \
      --replace-fail 'set -euo pipefail' 'set -euo pipefail; PATH="${lib.makeBinPath [ jq ]}:$PATH"'
    runHook postInstall
  '';

  meta = with lib; {
    description = "macOS notifications for herdr agent state changes";
    homepage = "https://github.com/dot/herdr-terminal-notifier";
    license = licenses.mit;
    platforms = platforms.darwin;
  };
}
