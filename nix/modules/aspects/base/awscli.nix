{
  den.aspects.base.homeManager = { lib, config, ... }: {
    programs = {
      awscli = {
        enable = true;

        settings = {
          "profile deployment" = {
            region = "ap-northeast-1";
            sso_account_id = "445411728232";
            sso_role_name = "AdministratorAccess";
            sso_session = "default";
          };

          "profile main" = {
            region = "ap-northeast-1";
            sso_account_id = "766612536658";
            sso_role_name = "AdministratorAccess";
            sso_session = "default";
          };

          "profile master" = {
            region = "ap-northeast-1";
            sso_account_id = "255571037684";
            sso_role_name = "AdministratorAccess";
            sso_session = "default";
          };

          "profile sandbox" = {
            region = "ap-northeast-1";
            sso_account_id = "978053779240";
            sso_role_name = "AdministratorAccess";
            sso_session = "default";
          };

          "profile security-operation" = {
            region = "ap-northeast-1";
            sso_account_id = "376129857884";
            sso_role_name = "AdministratorAccess";
            sso_session = "default";
          };

          "sso-session default" = {
            sso_region = "ap-northeast-1";
            sso_registration_scopes = "sso:account:access";
            sso_start_url = "https://d-956774a6a5.awsapps.com/start/";
          };
        };
      };

      zsh.completionInit = lib.mkAfter ''
        complete -C '${lib.getExe' config.programs.awscli.package "aws_completer"}' aws
      '';
    };
  };
}
