import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { expectFailure, expectSuccess } from "@core/utils";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, expect, test } from "vite-plus/test";

import { getPhoto, NotFoundError } from "../../lib/lambda/s3.ts";

const s3Mock = mockClient(S3Client);

const createBody = (bytes: Uint8Array) =>
  ({ transformToByteArray: async () => bytes }) as unknown as GetObjectCommandOutput["Body"];

beforeEach(() => {
  s3Mock.reset();
});

test("getPhoto fetches the object bytes", async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  s3Mock.on(GetObjectCommand).resolves({ Body: createBody(bytes) });

  const result = await getPhoto("bucket", "travel/photo.jpg");

  expect(expectSuccess(result)).toStrictEqual(bytes);
  const calls = s3Mock.commandCalls(GetObjectCommand);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.args[0]?.input).toStrictEqual({
    Bucket: "bucket",
    Key: "travel/photo.jpg",
  });
});

test("getPhoto returns Failure when the body is undefined", async () => {
  s3Mock.on(GetObjectCommand).resolves({});

  const result = await getPhoto("bucket", "travel/photo.jpg");

  expect(expectFailure(result).message).toBe("body is undefined");
});

test("getPhoto returns a NotFoundError when the object does not exist", async () => {
  s3Mock.on(GetObjectCommand).rejects(Object.assign(new Error("not found"), { name: "NoSuchKey" }));

  const result = await getPhoto("bucket", "travel/photo.jpg");

  expect(expectFailure(result)).toBeInstanceOf(NotFoundError);
});

test("getPhoto returns Failure when the request fails", async () => {
  s3Mock.on(GetObjectCommand).rejects(new Error("access denied"));

  const result = await getPhoto("bucket", "travel/photo.jpg");

  expect(expectFailure(result).message).toBe("access denied");
});
