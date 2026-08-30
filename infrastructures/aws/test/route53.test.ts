import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vite-plus/test";

import { Route53Stack } from "../lib/route53-stack.ts";
import snapshotPlugin from "../test/snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();

  const stack = new Route53Stack(app, "Route53Stack");

  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});
