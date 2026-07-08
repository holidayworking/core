{
  lib,
  buildGoModule,
  fetchFromGitHub,
  ...
}:
buildGoModule rec {
  pname = "cn-daemon";
  version = "1.0.0";

  src = fetchFromGitHub {
    owner = "ashmitb95";
    repo = "claude-notifier";
    rev = "daemon-v${version}";
    hash = "sha256-fTVD6SjsGXvu96WO51/IwgL74ZjcS+LAoL+s3jpi9a8=";
  };

  sourceRoot = "${src.name}/daemon";

  vendorHash = null;

  postInstall = ''
    mv $out/bin/daemon $out/bin/cn-daemon
  '';

  meta = with lib; {
    description = "Local audio daemon for claude-notifier remote hosts";
    homepage = "https://github.com/ashmitb95/claude-notifier";
    license = licenses.gpl3Only;
    mainProgram = "cn-daemon";
  };
}
