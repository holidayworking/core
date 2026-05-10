import * as cdk from "aws-cdk-lib/core";

import { RadicastStack } from "../lib/radicast-stack.ts";

const app = new cdk.App();

const props: cdk.StackProps = {
  env: {
    account: "766612536658",
    region: "ap-northeast-1",
  },
};

new RadicastStack(app, "RadicastStack", {
  ...props,
  stackName: "radicast-stack",
  terminationProtection: true,
});
