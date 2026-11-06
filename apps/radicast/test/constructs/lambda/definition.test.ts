import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { expectFailure, expectSuccess } from "@core/utils/test";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, expect, test } from "vite-plus/test";

import { findDefinition } from "../../../lib/constructs/lambda/definition.ts";
import { createDefinition } from "./fixtures.ts";

const s3Mock = mockClient(S3Client);

const createBody = (content: string) =>
  ({ transformToString: async () => content }) as unknown as GetObjectCommandOutput["Body"];

beforeEach(() => {
  s3Mock.reset();
});

test("findDefinition fetches and parses config.json", async () => {
  const definition = createDefinition();
  s3Mock.on(GetObjectCommand).resolves({ Body: createBody(JSON.stringify(definition)) });

  const result = await findDefinition("bucket", "yuna78mhz");

  expect(expectSuccess(result)).toStrictEqual(definition);
  const calls = s3Mock.commandCalls(GetObjectCommand);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.args[0]?.input).toStrictEqual({
    Bucket: "bucket",
    Key: "yuna78mhz/config.json",
  });
});

test("findDefinition returns Failure when the body is undefined", async () => {
  s3Mock.on(GetObjectCommand).resolves({});

  const result = await findDefinition("bucket", "yuna78mhz");

  expect(expectFailure(result).message).toBe("body is undefined");
});

test("findDefinition returns Failure when the body is not valid JSON", async () => {
  s3Mock.on(GetObjectCommand).resolves({ Body: createBody("not json") });

  const result = await findDefinition("bucket", "yuna78mhz");

  expect(result.isFailure()).toBe(true);
});

test("findDefinition returns Failure when the request fails", async () => {
  s3Mock.on(GetObjectCommand).rejects(new Error("access denied"));

  const result = await findDefinition("bucket", "yuna78mhz");

  expect(expectFailure(result).message).toBe("access denied");
});
