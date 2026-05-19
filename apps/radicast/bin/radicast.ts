import * as cdk from "aws-cdk-lib/core";
import { AwsSolutionsChecks } from "cdk-nag";

import { AcmStack } from "../lib/acm-stack.ts";
import { CloudfrontAccessLogStack } from "../lib/cloudfront-access-log-stack.ts";
import { RadicastStack } from "../lib/radicast-stack.ts";

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
  env: {
    account: "766612536658",
    region: "ap-northeast-1",
  },
  terminationProtection: true,
  crossRegionReferences: true,
};

const acmStack = new AcmStack(app, "RadicastAcmStack", {
  ...props,
  hostedZoneId,
  zoneName,
  env: {
    account: "766612536658",
    region: "us-east-1",
  },
  stackName: "radicast-acm-stack",
});

const radicastStack = new RadicastStack(app, "RadicastStack", {
  ...props,
  certificate: acmStack.certificate,
  hostedZoneId,
  zoneName,
  stackName: "radicast-stack",
});

new CloudfrontAccessLogStack(app, "RadicastCloudfrontAccessLogStack", {
  ...props,
  distribution: radicastStack.distribution,
  distributionLogsBucket: radicastStack.distributionLogsBucket,
  env: {
    account: "766612536658",
    region: "us-east-1",
  },
  stackName: "radicast-cloudfront-access-log-stack",
});

cdk.Aspects.of(app).add(new AwsSolutionsChecks());
