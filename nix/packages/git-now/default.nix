{
  lib,
  stdenv,
  fetchFromGitHub,
  ...
}:
stdenv.mkDerivation rec {
  pname = "git-now";
  version = "2025-06-14";

  src = fetchFromGitHub {
    owner = "iwata";
    repo = "git-now";
    rev = "74fd782889b04ed089667ef793074d6993a1b802";
    hash = "sha256-usBeW2OQsOawNMeQuKxr6XzFnA7IetNXREOL7FThnNs=";
    fetchSubmodules = true;
  };

  installPhase = ''
    runHook preInstall
    make prefix=$out install
    runHook postInstall
  '';

  meta = with lib; {
    description = "A temporary commit tool for git";
    homepage = "https://github.com/iwata/git-now";
    license = licenses.gpl2;
  };
}
