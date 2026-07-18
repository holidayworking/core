import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { cloudFrontInvalidation } from "../../../../../lib/constructs/lambda/cloudfront.ts";
import { handler } from "../../../../../lib/constructs/lambda/functions/cloudfront-invalidator/index.ts";
import { Failure, Success } from "../../../../../lib/constructs/lambda/result.ts";
import { createContext, createS3Event } from "../../fixtures.ts";
import { spyOnLoggerError } from "../../helpers.ts";

vi.mock("../../../../../lib/constructs/lambda/cloudfront.ts");

const cloudFrontInvalidationMock = vi.mocked(cloudFrontInvalidation);

const errorSpy = spyOnLoggerError();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DISTRIBUTION_ID", "E123EXAMPLE");
  cloudFrontInvalidationMock.mockResolvedValue(new Success(""));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("invalidates the updated object keys with a leading slash", async () => {
  await handler(
    createS3Event(
      { bucket: "bucket", key: "yuna78mhz/index.rss" },
      { bucket: "bucket", key: "nogizaka46nono/index.rss" },
    ),
    createContext(),
  );

  expect(cloudFrontInvalidationMock).toHaveBeenCalledExactlyOnceWith("E123EXAMPLE", [
    "/yuna78mhz/index.rss",
    "/nogizaka46nono/index.rss",
  ]);
  expect(errorSpy).not.toHaveBeenCalled();
});

test("logs an error when DISTRIBUTION_ID is not set", async () => {
  vi.stubEnv("DISTRIBUTION_ID", undefined);

  await handler(createS3Event({ bucket: "bucket", key: "yuna78mhz/index.rss" }), createContext());

  expect(errorSpy).toHaveBeenCalledWith("Environment variable DISTRIBUTION_ID is not set");
  expect(cloudFrontInvalidationMock).not.toHaveBeenCalled();
});

test("logs an error when the invalidation fails", async () => {
  const error = new Error("access denied");
  cloudFrontInvalidationMock.mockResolvedValue(new Failure(error));

  await handler(createS3Event({ bucket: "bucket", key: "yuna78mhz/index.rss" }), createContext());

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
});
