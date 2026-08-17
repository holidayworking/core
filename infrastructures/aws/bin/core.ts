import {
  AWS_DEPLOYMENT_ACCOUNT_ID,
  AWS_MAIN_ACCOUNT_ID,
  AWS_MASTER_ACCOUNT_ID,
  AWS_SECURITY_OPERATION_ACCOUNT_ID,
} from "@core/constants";
import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";

import { AcmStack } from "../lib/acm-stack.ts";
import { CloudfrontAccessLogStack } from "../lib/cloudfront-access-log-stack.ts";
import { CoreStack } from "../lib/core-stack.ts";
import { GithubActionsOidcStack } from "../lib/github-actions-oidc-stack.ts";
import { OrganizationsStack } from "../lib/organizations-stack.ts";
import { Route53Stack } from "../lib/route53-stack.ts";
import { SecurityHubStack } from "../lib/security-hub-stack.ts";

const app = new cdk.App();

const props: cdk.StackProps = {
  terminationProtection: true,
};

const route53Stack = new Route53Stack(app, "Route53Stack", {
  ...props,
  env: {
    account: AWS_MAIN_ACCOUNT_ID,
    region: "us-east-1",
  },
  stackName: "route53-stack",
});

const acmStack = new AcmStack(app, "AcmStack", {
  ...props,
  hostedZone: route53Stack.publicHostedZone,
  env: {
    account: AWS_MAIN_ACCOUNT_ID,
    region: "us-east-1",
  },
  stackName: "acm-stack",
  crossRegionReferences: true,
});

const coreStack = new CoreStack(app, "CoreStack", {
  ...props,
  hostedZone: route53Stack.publicHostedZone,
  photoCertificate: acmStack.photoCertificate,
  env: {
    account: AWS_MAIN_ACCOUNT_ID,
    region: "ap-northeast-1",
  },
  stackName: "core-stack",
  crossRegionReferences: true,
});

new CloudfrontAccessLogStack(app, "CloudfrontAccessLogStack", {
  ...props,
  photoDistribution: coreStack.photoDistribution,
  distributionLogsBucket: coreStack.distributionLogsBucket,
  env: {
    account: AWS_MAIN_ACCOUNT_ID,
    region: "us-east-1",
  },
  stackName: "cloudfront-access-log-stack",
  crossRegionReferences: true,
});

new GithubActionsOidcStack(app, "GithubActionsOidcStack", {
  ...props,
  env: {
    account: AWS_DEPLOYMENT_ACCOUNT_ID,
    region: "ap-northeast-1",
  },
  stackName: "github-actions-oidc-stack",
  targetAccountIds: [AWS_MAIN_ACCOUNT_ID, AWS_MASTER_ACCOUNT_ID, AWS_SECURITY_OPERATION_ACCOUNT_ID],
});

new OrganizationsStack(app, "OrganizationsStack", {
  ...props,
  env: {
    account: AWS_MASTER_ACCOUNT_ID,
    region: "ap-northeast-1",
  },
  stackName: "organizations-stack",
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
