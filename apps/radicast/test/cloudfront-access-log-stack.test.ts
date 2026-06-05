import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { expect, test } from "vitest";

import { AcmStack } from "../lib/acm-stack.ts";
import { CloudfrontAccessLogStack } from "../lib/cloudfront-access-log-stack.ts";
import { RadicastStack } from "../lib/radicast-stack.ts";
import snapshotPlugin from "./snapshot-plugin.ts";

expect.addSnapshotSerializer(snapshotPlugin);

test("snapshot", () => {
  const app = new App();

  const acmStack = new AcmStack(app, "RadicastAcmStack", {
    hostedZoneId: "ZOJJZC49E0EPZ",
    zoneName: "example.com",
  });

  const radicastStack = new RadicastStack(app, "RadicastStack", {
    certificate: acmStack.certificate,
    hostedZoneId: "ZOJJZC49E0EPZ",
    zoneName: "example.com",
    definitions: [
      {
        id: "yuna78mhz",
        title: "乃木坂46 柴田柚菜のDreaming time",
        author: "柴田柚菜",
        image: "https://program-static.cf.radiko.jp/4shbilswvp.jpg",
        area: "JP13",
        station: "BAYFM78",
        programSchedules: ["00 23 * * 2"],
        executionSchedule: "00 00 ? * 4 *",
      },
    ],
  });

  const stack = new CloudfrontAccessLogStack(app, "RadicastCloudfrontAccessLogStack", {
    distribution: radicastStack.distribution,
    distributionLogsBucket: radicastStack.distributionLogsBucket,
  });

  const template = Template.fromStack(stack);
  expect(template).toMatchSnapshot();
}, 180_000);
