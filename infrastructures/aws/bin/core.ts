import {
  AWS_DEPLOYMENT_ACCOUNT_ID,
  AWS_MAIN_ACCOUNT_ID,
  AWS_SECURITY_OPERATION_ACCOUNT_ID,
} from "@core/constants";
import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";

import { CoreStack } from "../lib/core-stack.ts";
import { GithubActionsOidcStack } from "../lib/github-actions-oidc-stack.ts";
import { Route53Stack } from "../lib/route53-stack.ts";
import { SecurityHubStack } from "../lib/security-hub-stack.ts";

const app = new cdk.App();

const props: cdk.StackProps = {
  terminationProtection: true,
};

new CoreStack(app, "CoreStack", {
  ...props,
  env: {
    account: AWS_MAIN_ACCOUNT_ID,
    region: "ap-northeast-1",
  },
  stackName: "core-stack",
});

new GithubActionsOidcStack(app, "GithubActionsOidcStack", {
  ...props,
  env: {
    account: AWS_DEPLOYMENT_ACCOUNT_ID,
    region: "ap-northeast-1",
  },
  stackName: "github-actions-oidc-stack",
  targetAccountIds: [AWS_MAIN_ACCOUNT_ID, AWS_SECURITY_OPERATION_ACCOUNT_ID],
});

new Route53Stack(app, "Route53Stack", {
  ...props,
  env: {
    account: AWS_MAIN_ACCOUNT_ID,
    region: "us-east-1",
  },
  stackName: "route53-stack",
});

new SecurityHubStack(app, "SecurityHubStack", {
  ...props,
  env: {
    account: AWS_SECURITY_OPERATION_ACCOUNT_ID,
    region: "ap-northeast-1",
  },
  stackName: "security-hub-stack",
});

cdk.Validations.of(app).addPlugins(new AwsSolutionsChecks(app));
