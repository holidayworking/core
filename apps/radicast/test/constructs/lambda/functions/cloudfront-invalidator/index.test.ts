import { Logger } from "@aws-lambda-powertools/logger";
import { Failure, Success } from "@core/utils";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { invalidateCache } from "../../../../../lib/constructs/lambda/cdn.ts";
import { handler } from "../../../../../lib/constructs/lambda/functions/cloudfront-invalidator/index.ts";
import { createContext, createS3Event } from "../../fixtures.ts";

vi.mock("../../../../../lib/constructs/lambda/cdn.ts");

const invalidateCacheMock = vi.mocked(invalidateCache);

const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DISTRIBUTION_ID", "E123EXAMPLE");
  invalidateCacheMock.mockResolvedValue(new Success(""));
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

  expect(invalidateCacheMock).toHaveBeenCalledExactlyOnceWith("E123EXAMPLE", [
    "/yuna78mhz/index.rss",
    "/nogizaka46nono/index.rss",
  ]);
  expect(errorSpy).not.toHaveBeenCalled();
});

test("logs an error when DISTRIBUTION_ID is not set", async () => {
  vi.stubEnv("DISTRIBUTION_ID", undefined);

  await handler(createS3Event({ bucket: "bucket", key: "yuna78mhz/index.rss" }), createContext());

  expect(errorSpy).toHaveBeenCalledWith("Environment variable DISTRIBUTION_ID is not set");
  expect(invalidateCacheMock).not.toHaveBeenCalled();
});

test("logs an error when the invalidation fails", async () => {
  const error = new Error("access denied");
  invalidateCacheMock.mockResolvedValue(new Failure(error));

  await handler(createS3Event({ bucket: "bucket", key: "yuna78mhz/index.rss" }), createContext());

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
});
