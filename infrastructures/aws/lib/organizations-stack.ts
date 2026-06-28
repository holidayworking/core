import { AWS_SECURITY_OPERATION_ACCOUNT_ID } from "@core/constants";
import * as cdk from "aws-cdk-lib";
import { CfnOrganization } from "aws-cdk-lib/aws-organizations";
import { CfnDelegatedAdmin, CfnHub } from "aws-cdk-lib/aws-securityhub";
import { Construct } from "constructs";

export class OrganizationsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const organization = new CfnOrganization(this, "Organization", {
      featureSet: "ALL",
    });

    const securityHub = new CfnHub(this, "SecurityHub", {});
    securityHub.addDependency(organization);

    const SecurityHubDelegatedAdmin = new CfnDelegatedAdmin(this, "SecurityHubDelegatedAdmin", {
      adminAccountId: AWS_SECURITY_OPERATION_ACCOUNT_ID,
    });
    SecurityHubDelegatedAdmin.addDependency(securityHub);
  }
}
