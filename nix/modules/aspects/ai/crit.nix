{
  flake-file.inputs.crit = {
    url = "github:tomasz-tomczyk/crit";
    inputs.nixpkgs.follows = "nixpkgs";
  };

  den.aspects.ai.os =
    { inputs', ... }:
    {
      environment.systemPackages = [ inputs'.crit.packages.default ];
    };
}
