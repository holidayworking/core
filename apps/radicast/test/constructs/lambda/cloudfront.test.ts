import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, expect, test } from "vitest";

import { cloudFrontInvalidation } from "../../../lib/constructs/lambda/cloudfront.ts";
import { expectFailure } from "./helpers.ts";

const cloudFrontMock = mockClient(CloudFrontClient);

beforeEach(() => {
  cloudFrontMock.reset();
});

test("creates an invalidation for the given paths", async () => {
  cloudFrontMock.on(CreateInvalidationCommand).resolves({});

  const result = await cloudFrontInvalidation("E123EXAMPLE", ["/yuna78mhz/index.rss"]);

  expect(result.isSuccess()).toBe(true);
  const calls = cloudFrontMock.commandCalls(CreateInvalidationCommand);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.args[0]?.input).toStrictEqual({
    DistributionId: "E123EXAMPLE",
    InvalidationBatch: {
      Paths: {
        // NOTE: Quantity is fixed at 1 regardless of the number of paths (current behavior)
        Quantity: 1,
        Items: ["/yuna78mhz/index.rss"],
      },
      CallerReference: expect.stringMatching(/^\d+$/),
    },
  });
});

test("returns Failure when the invalidation fails", async () => {
  cloudFrontMock.on(CreateInvalidationCommand).rejects(new Error("access denied"));

  const result = await cloudFrontInvalidation("E123EXAMPLE", ["/yuna78mhz/index.rss"]);

  expect(expectFailure(result).message).toBe("access denied");
});
