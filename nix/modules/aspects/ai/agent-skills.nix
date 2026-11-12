{ inputs, ... }:
{
  flake-file.inputs = {
    agent-skills = {
      url = "github:Kyure-A/agent-skills-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    vercel-labs-skills = {
      url = "github:vercel-labs/agent-skills";
      flake = false;
    };
  };

  den.aspects.ai.homeManager = {
    imports = [
      inputs.agent-skills.homeManagerModules.default
    ];

    programs.agent-skills = {
      enable = true;

      skills.enable = [
        "react-best-practices"
      ];

      sources.vercel-labs = {
        path = inputs.vercel-labs-skills.outPath;
        subdir = "skills";
      };

      targets.claude.enable = true;
    };
  };
}
