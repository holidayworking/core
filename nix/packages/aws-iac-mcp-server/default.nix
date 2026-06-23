{
  python3Packages,
  fetchurl,
  rustPlatform,
  cargo,
  rustc,
  ...
}:
let
  guardpycfnSrc = fetchurl {
    url = "https://files.pythonhosted.org/packages/5c/b9/56497fc0dd11151e8f2c30040a4181045a5718646e2cd2279d2390e29be2/guardpycfn-0.1.0.tar.gz";
    hash = "sha256-OW2RxDwUjkGZhWEEatlCq9ZXNXbbqaYNW0a87EZu0BA=";
  };

  guardpycfn = python3Packages.buildPythonPackage {
    pname = "guardpycfn";
    version = "0.1.0";
    pyproject = true;

    src = guardpycfnSrc;

    cargoDeps = rustPlatform.fetchCargoVendor {
      src = guardpycfnSrc;
      hash = "sha256-OFR2AQLTwtrOvhHnd2FnaxAezBYtTRKFAlsG+A2BVlM=";
    };

    nativeBuildInputs = [
      rustPlatform.cargoSetupHook
      rustPlatform.maturinBuildHook
      cargo
      rustc
    ];

    doCheck = false;
  };
in
python3Packages.buildPythonApplication {
  pname = "awslabs_aws_iac_mcp_server";
  version = "1.0.19";
  pyproject = true;

  src = fetchurl {
    url = "https://files.pythonhosted.org/packages/1b/56/fbb3b6587a335401dadcbe6155698bdeba85e1308a6825de086575fbb359/awslabs_aws_iac_mcp_server-1.0.19.tar.gz";
    hash = "sha256-DRI7Ag8BOO5BQCh2UFI6VgHX1H8EVOaxGid8p7vsU5s=";
  };

  nativeBuildInputs = with python3Packages; [ hatchling ];

  propagatedBuildInputs = with python3Packages; [
    boto3
    botocore
    cfn-lint
    fastmcp
    guardpycfn
    loguru
    mcp
    pydantic
    pyyaml
  ];

  doCheck = false;

  meta.mainProgram = "awslabs.aws-iac-mcp-server";
}
