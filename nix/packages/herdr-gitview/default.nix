{
  git,
  lib,
  rustPlatform,
  sources,
  ...
}:
rustPlatform.buildRustPackage {
  inherit (sources.herdr-gitview) pname src;

  version = lib.removePrefix "v" sources.herdr-gitview.version;

  cargoLock = sources.herdr-gitview.cargoLock."Cargo.lock";

  # Run the unit tests only: some integration tests under tests/ drive the herdr
  # desktop app setup or a live terminal, which the build sandbox doesn't allow.
  cargoTestFlags = [ "--bins" ];

  meta = with lib; {
    description = "Two-pane git view plugin for herdr";
    homepage = "https://github.com/ChmaraX/herdr-gitview";
    license = licenses.mit;
    mainProgram = "herdr-gitview";
    platforms = platforms.unix;
  };

  # Tests run git on fixture repositories.
  nativeCheckInputs = [ git ];

  # The herdr plugin layout `herdr plugin link` expects: herdr-plugin.toml and
  # herdr/run.sh, which runs bin/herdr-gitview.
  postInstall = ''
    install -Dm444 -t $out herdr-plugin.toml
    install -Dm555 -t $out/herdr herdr/run.sh
  '';
}
