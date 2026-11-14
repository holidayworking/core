{
  git,
  lib,
  ps,
  rustPlatform,
  sources,
  ...
}:
rustPlatform.buildRustPackage {
  inherit (sources.herdr-nvim) pname src;

  version = lib.removePrefix "v" sources.herdr-nvim.version;

  cargoLock = sources.herdr-nvim.cargoLock."Cargo.lock";

  # Run the unit tests only: the integration tests under tests/ spawn nvim
  # daemons and read the process table, which the build sandbox doesn't allow.
  cargoTestFlags = [ "--bins" ];

  # These need the plugin's own git checkout or a readable process table.
  checkFlags = [
    "--skip=daemon::registry::tests::gc_removes_orphan_entries_and_keeps_known_tabs"
    "--skip=daemon::tests::a_missing_nvim_names_the_nvim_bin_setting"
    "--skip=picker::tests::fff_end_to_end_over_this_repo"
  ];

  # Keep doc/ at the top level for Neovim's :help instead of moving it to share/.
  forceShare = [
    "info"
    "man"
  ];

  meta = with lib; {
    description = "Neovim sidebar with agent annotations for herdr";
    homepage = "https://github.com/ChmaraX/herdr-nvim";
    license = licenses.mit;
    mainProgram = "herdr-nvim";
    platforms = platforms.unix;
  };

  # Tests run git and ps on scratch repositories and processes.
  nativeCheckInputs = [
    git
    ps
  ];

  # One output serves both halves: the herdr plugin (herdr-plugin.toml and
  # bin/herdr-nvim, linked with `herdr plugin link`) and the Neovim plugin
  # (lua/, plugin/ and doc/, added to Nixvim's extraPlugins).
  postInstall = ''
    install -Dm444 -t $out herdr-plugin.toml
    cp -r doc lua plugin $out/
  '';
}
