{
  flake-file.inputs.crit = {
    url = "github:tomasz-tomczyk/crit";
    inputs.nixpkgs.follows = "nixpkgs";
  };

  den.aspects.ai.homeManager =
    { inputs', ... }:
    {
      home.packages = [ inputs'.crit.packages.default ];
    };
}
