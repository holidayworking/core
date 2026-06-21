import { GithubActionsIdentityProvider, GithubActionsRole } from "aws-cdk-github-oidc";
import * as cdk from "aws-cdk-lib";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface GithubActionsOidcStackProps extends cdk.StackProps {
  targetAccountIds: string[];
}

export class GithubActionsOidcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GithubActionsOidcStackProps) {
    super(scope, id, props);

    const provider = new GithubActionsIdentityProvider(this, "Provider");

    const role = new GithubActionsRole(this, "Role", {
      owner: "holidayworking",
      provider,
      repo: "core",
      roleName: "github-actions",
    });

    const qualifier = cdk.DefaultStackSynthesizer.DEFAULT_QUALIFIER;

    role.attachInlinePolicy(
      new Policy(this, "AssumeRolePolicy", {
        statements: [
          new PolicyStatement({
            actions: ["sts:AssumeRole"],
            resources: [this.account, ...props.targetAccountIds].flatMap((accountId) => [
              `arn:aws:iam::${accountId}:role/cdk-${qualifier}-deploy-role-${accountId}-${this.region}`,
              `arn:aws:iam::${accountId}:role/cdk-${qualifier}-file-publishing-role-${accountId}-${this.region}`,
              `arn:aws:iam::${accountId}:role/cdk-${qualifier}-image-publishing-role-${accountId}-${this.region}`,
              `arn:aws:iam::${accountId}:role/cdk-${qualifier}-lookup-role-${accountId}-${this.region}`,
              `arn:aws:iam::${accountId}:role/cdk-${qualifier}-deploy-role-${accountId}-us-east-1`,
              `arn:aws:iam::${accountId}:role/cdk-${qualifier}-file-publishing-role-${accountId}-us-east-1`,
              `arn:aws:iam::${accountId}:role/cdk-${qualifier}-image-publishing-role-${accountId}-us-east-1`,
              `arn:aws:iam::${accountId}:role/cdk-${qualifier}-lookup-role-${accountId}-us-east-1`,
            ]),
          }),
        ],
      }),
    );
  }
}
