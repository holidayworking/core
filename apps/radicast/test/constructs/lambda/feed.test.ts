import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { expectFailure } from "@core/utils/test";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, expect, test } from "vite-plus/test";

import { saveFeed } from "../../../lib/constructs/lambda/feed.ts";

const s3Mock = mockClient(S3Client);

beforeEach(() => {
  s3Mock.reset();
});

test("saveFeed uploads the feed as index.rss", async () => {
  s3Mock.on(PutObjectCommand).resolves({});

  const result = await saveFeed("bucket", "yuna78mhz", "<rss />");

  expect(result.isSuccess()).toBe(true);
  const calls = s3Mock.commandCalls(PutObjectCommand);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.args[0]?.input).toStrictEqual({
    Bucket: "bucket",
    Key: "yuna78mhz/index.rss",
    Body: "<rss />",
  });
});

test("saveFeed returns Failure when the upload fails", async () => {
  s3Mock.on(PutObjectCommand).rejects(new Error("upload failed"));

  const result = await saveFeed("bucket", "yuna78mhz", "<rss />");

  expect(expectFailure(result).message).toBe("upload failed");
});
