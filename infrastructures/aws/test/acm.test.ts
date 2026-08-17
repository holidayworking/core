import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { AcmStack } from "../lib/acm-stack.ts";
import { Route53Stack } from "../lib/route53-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();

  const route53Stack = new Route53Stack(app, "Route53Stack");

  const stack = new AcmStack(app, "AcmStack", {
    hostedZone: route53Stack.publicHostedZone,
  });

  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});
