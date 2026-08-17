import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { AcmStack } from "../lib/acm-stack.ts";
import { CloudfrontAccessLogStack } from "../lib/cloudfront-access-log-stack.ts";
import { CoreStack } from "../lib/core-stack.ts";
import { Route53Stack } from "../lib/route53-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();

  const route53Stack = new Route53Stack(app, "Route53Stack");

  const acmStack = new AcmStack(app, "AcmStack", {
    hostedZone: route53Stack.publicHostedZone,
  });

  const coreStack = new CoreStack(app, "CoreStack", {
    hostedZone: route53Stack.publicHostedZone,
    photoCertificate: acmStack.photoCertificate,
  });

  const stack = new CloudfrontAccessLogStack(app, "CloudfrontAccessLogStack", {
    photoDistribution: coreStack.photoDistribution,
    distributionLogsBucket: coreStack.distributionLogsBucket,
  });

  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});
