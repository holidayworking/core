import { AWS_MAIN_ACCOUNT_ID } from "@core/constants";
import * as cdk from "aws-cdk-lib/core";
import { AwsSolutionsChecks } from "cdk-nag";

import { AcmStack } from "../lib/acm-stack.ts";
import { CloudfrontAccessLogStack } from "../lib/cloudfront-access-log-stack.ts";
import { PhotoStack } from "../lib/photo-stack.ts";

const requireAppContext = (app: cdk.App, key: string) => {
  const value = app.node.tryGetContext(key);
  if (typeof value !== "string" || value === "") {
    throw new Error(`Context value "${key}" is required.`);
  }
  return value;
};

const app = new cdk.App();

const hostedZoneId = requireAppContext(app, "hostedZoneId");
const zoneName = requireAppContext(app, "zoneName");

const props: cdk.StackProps = {
  terminationProtection: true,
  crossRegionReferences: true,
};

const acmStack = new AcmStack(app, "PhotoAcmStack", {
  ...props,
  hostedZoneId,
  zoneName,
  env: {
    account: AWS_MAIN_ACCOUNT_ID,
    region: "us-east-1",
  },
  stackName: "photo-acm-stack",
});

const photoStack = new PhotoStack(app, "PhotoStack", {
  ...props,
  certificate: acmStack.certificate,
  hostedZoneId,
  zoneName,
  env: {
    account: AWS_MAIN_ACCOUNT_ID,
    region: "ap-northeast-1",
  },
  stackName: "photo-stack",
});

new CloudfrontAccessLogStack(app, "PhotoCloudfrontAccessLogStack", {
  ...props,
  distribution: photoStack.distribution,
  distributionLogsBucket: photoStack.distributionLogsBucket,
  env: {
    account: AWS_MAIN_ACCOUNT_ID,
    region: "us-east-1",
  },
  stackName: "photo-cloudfront-access-log-stack",
});

cdk.Validations.of(app).addPlugins(new AwsSolutionsChecks(app));
