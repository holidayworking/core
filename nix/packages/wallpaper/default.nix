{
  lib,
  fetchurl,
  imagemagick,
  runCommand,
  ...
}:
let
  # "FIA F1 Austria 2026 Nr. 14 Alonso (2)" by Lukas Raich, CC BY-SA 4.0, resized and darkened
  photo = fetchurl {
    name = "alonso-amr26.jpg";
    url = "https://upload.wikimedia.org/wikipedia/commons/3/39/FIA_F1_Austria_2026_Nr._14_Alonso_%282%29.jpg";
    hash = "sha256-hPMOspHNuczTbnKnXwS9NWY8WlBxpygh1ODiZUVnSiw=";
  };
in
runCommand "alonso-amr26-dark.jpg"
  {
    meta = with lib; {
      description = "Photo of Fernando Alonso's Aston Martin AMR26, darkened for use as a wallpaper";
      homepage = "https://commons.wikimedia.org/wiki/File:FIA_F1_Austria_2026_Nr._14_Alonso_(2).jpg";
      license = licenses.cc-by-sa-40;
      platforms = platforms.all;
    };

    nativeBuildInputs = [ imagemagick ];
  }
  ''
    magick ${photo} -resize 2560x -evaluate multiply 0.6 -quality 95 $out
  ''
