import { AWS_MAIN_ACCOUNT_ID } from "@core/constants";
import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vite-plus/test";

import { CoreStack } from "../lib/core-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();

  const stack = new CoreStack(app, "CoreStack", {
    env: {
      account: AWS_MAIN_ACCOUNT_ID,
      region: "ap-northeast-1",
    },
  });

  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});
