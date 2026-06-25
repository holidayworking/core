import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { OrganizationsStack } from "../lib/organizations-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();
  const stack = new OrganizationsStack(app, "OrganizationsStack");
  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});
