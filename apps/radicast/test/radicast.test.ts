import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { AcmStack } from "../lib/acm-stack.ts";
import { RadicastStack } from "../lib/radicast-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();

  const acmStack = new AcmStack(app, "RadicastAcmStack", {
    hostedZoneId: "ZOJJZC49E0EPZ",
    zoneName: "example.com",
  });

  const stack = new RadicastStack(app, "RadicastStack", {
    certificate: acmStack.certificate,
    hostedZoneId: "ZOJJZC49E0EPZ",
    zoneName: "example.com",
  });

  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
}, 180_000);
