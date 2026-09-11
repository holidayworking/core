{
  lib,
  stdenvNoCC,
  fetchzip,
  ...
}:
stdenvNoCC.mkDerivation rec {
  pname = "firple";
  version = "6.400";

  src = fetchzip {
    url = "https://github.com/negset/Firple/releases/download/${version}/Firple.zip";
    hash = "sha256-ZQlz3vqdH2874DyaJ1mSPOSiO9oOv1TWj54fcsUXJq0=";
    stripRoot = false;
  };

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
}
