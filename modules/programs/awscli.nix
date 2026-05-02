{ delib, ... }:
delib.module {
  name = "programs.awscli";

  home.always.programs.awscli = {
    enable = true;

    settings = {
      "sso-session default" = {
        sso_start_url = "https://d-956774a6a5.awsapps.com/start/";
        sso_region = "ap-northeast-1";
        sso_registration_scopes = "sso:account:access";
      };

      "profile main" = {
        sso_session = "default";
        sso_account_id = "766612536658";
        sso_role_name = "AdministratorAccess";
        region = "ap-northeast-1";
      };

      "profile master" = {
        sso_session = "default";
        sso_account_id = "255571037684";
        sso_role_name = "AdministratorAccess";
        region = "ap-northeast-1";
      };

      "profile sandbox" = {
        sso_session = "default";
        sso_account_id = "978053779240";
        sso_role_name = "AdministratorAccess";
        region = "ap-northeast-1";
      };

      "profile security-operation" = {
        sso_session = "default";
        sso_account_id = "376129857884";
        sso_role_name = "AdministratorAccess";
        region = "ap-northeast-1";
      };
    };
  };
}
