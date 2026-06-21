import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";

import { CoreStack } from "../lib/core-stack.ts";
import { GithubActionsOidcStack } from "../lib/github-actions-oidc-stack.ts";
import { Route53Stack } from "../lib/route53-stack.ts";

const app = new cdk.App();

const props: cdk.StackProps = {
  terminationProtection: true,
};

new GithubActionsOidcStack(app, "GithubActionsOidcStack", {
  ...props,
  env: {
    account: "445411728232",
    region: "ap-northeast-1",
  },
  stackName: "github-actions-oidc-stack",
});

new Route53Stack(app, "Route53Stack", {
  ...props,
  env: {
    account: "766612536658",
    region: "us-east-1",
  },
  stackName: "route53-stack",
});

new CoreStack(app, "CoreStack", {
  ...props,
  env: {
    account: "766612536658",
    region: "ap-northeast-1",
  },
  stackName: "core-stack",
});

cdk.Validations.of(app).addPlugins(new AwsSolutionsChecks(app));
