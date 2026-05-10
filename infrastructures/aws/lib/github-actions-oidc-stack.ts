import { GithubActionsIdentityProvider, GithubActionsRole } from "aws-cdk-github-oidc";
import * as cdk from "aws-cdk-lib";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class GithubActionsOidcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const provider = new GithubActionsIdentityProvider(this, "Provider");

    const role = new GithubActionsRole(this, "Role", {
      owner: "holidayworking",
      provider,
      repo: "core",
      roleName: "github-actions-role",
    });

    role.attachInlinePolicy(
      new Policy(this, "AssumeRolePolicy", {
        statements: [
          new PolicyStatement({
            actions: ["sts:AssumeRole"],
            resources: [
              `arn:aws:iam::${this.account}:role/cdk-hnb659fds-deploy-role-${this.account}-${this.region}`,
              `arn:aws:iam::${this.account}:role/cdk-hnb659fds-file-publishing-role-${this.account}-${this.region}`,
              `arn:aws:iam::${this.account}:role/cdk-hnb659fds-image-publishing-role-${this.account}-${this.region}`,
              `arn:aws:iam::${this.account}:role/cdk-hnb659fds-lookup-role-${this.account}-${this.region}`,
              `arn:aws:iam::${this.account}:role/cdk-hnb659fds-deploy-role-${this.account}-us-east-1`,
              `arn:aws:iam::${this.account}:role/cdk-hnb659fds-file-publishing-role-${this.account}-us-east-1`,
              `arn:aws:iam::${this.account}:role/cdk-hnb659fds-image-publishing-role-${this.account}-us-east-1`,
              `arn:aws:iam::${this.account}:role/cdk-hnb659fds-lookup-role-${this.account}-us-east-1`,
            ],
          }),
        ],
      }),
    );
  }
}
