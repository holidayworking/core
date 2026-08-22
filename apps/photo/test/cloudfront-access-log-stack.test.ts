import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { AcmStack } from "../lib/acm-stack.ts";
import { CloudfrontAccessLogStack } from "../lib/cloudfront-access-log-stack.ts";
import { PhotoStack } from "../lib/photo-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();

  const acmStack = new AcmStack(app, "PhotoAcmStack", {
    hostedZoneId: "ZOJJZC49E0EPZ",
    zoneName: "example.com",
  });

  const photoStack = new PhotoStack(app, "PhotoStack", {
    certificate: acmStack.certificate,
    hostedZoneId: "ZOJJZC49E0EPZ",
    zoneName: "example.com",
  });

  const stack = new CloudfrontAccessLogStack(app, "PhotoCloudfrontAccessLogStack", {
    distribution: photoStack.distribution,
    distributionLogsBucket: photoStack.distributionLogsBucket,
  });

  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
}, 180_000);
