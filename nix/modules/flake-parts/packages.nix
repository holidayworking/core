{
  flake-file.inputs.amis = {
    url = "github:NixOS/amis";
    inputs.nixpkgs.follows = "nixpkgs";
  };

  perSystem =
    { inputs', pkgs, ... }:
    {
      packages = {
        build-hugo = pkgs.stdenv.mkDerivation {
          name = "build-hugo";

          buildPhase = ''
            hugo --minify
          '';

          installPhase = ''
            cp -r ./public $out
          '';

          nativeBuildInputs = [ pkgs.hugo ];

          src = ../../../apps/hugo;
        };

        # The EBS Direct upload hardcodes 64 concurrent connections and a
        # 12s read timeout, which drops connections on a home uplink. Patch
        # it to lower the concurrency, raise the timeouts, and skip sending
        # all-zero blocks.
        upload-ami = inputs'.amis.packages.upload-ami.overrideAttrs (old: {
          patches = (old.patches or [ ]) ++ [ ../../patches/upload-ami-tune-ebs-direct-upload.patch ];
        });
      };
    };
}
