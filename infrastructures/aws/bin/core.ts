import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";

import { CoreStack } from "../lib/core-stack.ts";
import { GithubActionsOidcStack } from "../lib/github-actions-oidc-stack.ts";
import { Route53Stack } from "../lib/route53-stack.ts";

const app = new cdk.App();

const props: cdk.StackProps = {
  env: {
    account: "766612536658",
    region: "ap-northeast-1",
  },
};

new GithubActionsOidcStack(app, "GithubActionsOidcStack", {
  ...props,
  stackName: "github-actions-oidc-stack",
  terminationProtection: true,
});

new Route53Stack(app, "Route53Stack", {
  ...props,
  env: {
    account: "766612536658",
    region: "us-east-1",
  },
  stackName: "route53-stack",
  terminationProtection: true,
});

new CoreStack(app, "CoreStack", {
  ...props,
  stackName: "core-stack",
  terminationProtection: true,
});

cdk.Aspects.of(app).add(new AwsSolutionsChecks());
