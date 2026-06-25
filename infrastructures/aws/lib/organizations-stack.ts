import * as cdk from "aws-cdk-lib";
import { CfnOrganization } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";

export class OrganizationsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new CfnOrganization(this, "Organization", {
      featureSet: "ALL",
    });
  }
}
