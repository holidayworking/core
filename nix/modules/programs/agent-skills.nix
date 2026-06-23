{ delib, inputs, ... }:
delib.module {
  name = "programs.agent-skills";

  home.always = {
    imports = [ inputs.agent-skills.homeManagerModules.default ];

    programs.agent-skills = {
      enable = true;

      sources.vercel-labs = {
        path = inputs.vercel-labs-skills.outPath;
        subdir = "skills";
      };

      skills.enable = [
        "react-best-practices"
      ];

      targets.claude.enable = true;
    };
  };
}
