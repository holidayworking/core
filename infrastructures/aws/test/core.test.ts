import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { CoreStack } from "../lib/core-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();
  const stack = new CoreStack(app, "CoreStack");
  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});
