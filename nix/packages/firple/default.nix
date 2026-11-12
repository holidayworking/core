{
  lib,
  sources,
  stdenvNoCC,
  unzip,
  ...
}:
stdenvNoCC.mkDerivation {
  inherit (sources.firple) pname version src;

  installPhase = ''
    runHook preInstall
    install -Dm444 -t $out/share/fonts/truetype *.ttf
    runHook postInstall
  '';

  meta = with lib; {
    description = "Ricty-like font that combines Fira Code and IBM Plex Sans JP";
    homepage = "https://github.com/negset/Firple";
    license = licenses.ofl;
    platforms = platforms.all;
  };

  nativeBuildInputs = [ unzip ];

  sourceRoot = ".";
}
