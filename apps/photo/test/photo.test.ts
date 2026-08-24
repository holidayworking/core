import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { AcmStack } from "../lib/acm-stack.ts";
import { PhotoStack } from "../lib/photo-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

// `Function` bundles `sharp` via Docker (nodeModules install), which can take
// longer than the default 5s test timeout.
const BUNDLING_TIMEOUT_MS = 120_000;

test(
  "snapshot",
  () => {
    const app = new App();

    const acmStack = new AcmStack(app, "PhotoAcmStack", {
      hostedZoneId: "ZOJJZC49E0EPZ",
      zoneName: "example.com",
    });

    const stack = new PhotoStack(app, "PhotoStack", {
      certificate: acmStack.certificate,
      hostedZoneId: "ZOJJZC49E0EPZ",
      zoneName: "example.com",
    });

    const template = Template.fromStack(stack);
    expect(template).toMatchSnapshot();
  },
  BUNDLING_TIMEOUT_MS,
);
