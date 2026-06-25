import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { SecurityHubStack } from "../lib/security-hub-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();
  const stack = new SecurityHubStack(app, "SecurityHubStack");
  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});
