import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { GithubActionsOidcStack } from "../lib/github-actions-oidc-stack.ts";
import snapshotPlugin from "../test/snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();
  const stack = new GithubActionsOidcStack(app, "GithubActionsOidc");
  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});
