{
  lib,
  buildGoModule,
  fetchFromGitHub,
  ffmpeg,
  makeBinaryWrapper,
  ...
}:
buildGoModule {
  pname = "radigo";
  version = "0-unstable-2026-02-22";

  src = fetchFromGitHub {
    owner = "yfujikaw";
    repo = "radigo";
    rev = "bb1a26850bbf4d4a7809d35b2f4a97cf77611d08";
    hash = "sha256-EivGxiOAuu5umPi0wabY+dAbUdHvMiwSK3bipxtOcGs=";
  };

  env.CGO_ENABLED = 0;

  ldflags = [
    "-s"
    "-w"
  ];

  meta = with lib; {
    description = "Record radiko";
    homepage = "https://github.com/yfujikaw/radigo";
    license = licenses.gpl3Only;
    mainProgram = "radigo";
  };

  nativeBuildInputs = [ makeBinaryWrapper ];

  # Record stations outside the current area with radiko premium (area free).
  patches = [ ../../patches/radigo-areafree-timefree.patch ];

  # radigo looks up ffmpeg on PATH at runtime.
  postInstall = ''
    wrapProgram $out/bin/radigo --prefix PATH : ${lib.makeBinPath [ ffmpeg ]}
  '';

  subPackages = [ "cmd/radigo" ];

  vendorHash = "sha256-fASJvEZ3GMNsHSxdq3kS2jz4kJV/oey37JJxYZGLDzU=";
}
