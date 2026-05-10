import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { RadicastStack } from "../lib/radicast-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();
  const stack = new RadicastStack(app, "RadicastStack");
  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});
