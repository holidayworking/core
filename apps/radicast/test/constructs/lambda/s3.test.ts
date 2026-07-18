import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { createReadStream } from "fs";
import { beforeEach, expect, test, vi } from "vitest";

import { Episode } from "../../../lib/constructs/lambda/episode.ts";
import {
  findDefinition,
  listEpisodes,
  saveEpisode,
  saveFeed,
} from "../../../lib/constructs/lambda/s3.ts";
import { createDefinition } from "./fixtures.ts";
import { expectFailure, expectSuccess } from "./helpers.ts";

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  createReadStream: vi.fn(() => "dummy stream"),
}));

const s3Mock = mockClient(S3Client);

const createBody = (content: string) =>
  ({ transformToString: async () => content }) as unknown as GetObjectCommandOutput["Body"];

beforeEach(() => {
  s3Mock.reset();
  vi.clearAllMocks();
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

test("saveEpisode uploads the local file with a JST-based key", async () => {
  s3Mock.on(PutObjectCommand).resolves({});
  const episode = Episode.from({
    startedAt: new Date("2026-07-14T14:00:00Z"),
    localPath: "/tmp/20260714230000-BAYFM78.m4a",
  });

  const result = await saveEpisode("bucket", "yuna78mhz", episode);

  expect(result.isSuccess()).toBe(true);
  const calls = s3Mock.commandCalls(PutObjectCommand);
  expect(calls).toHaveLength(1);
  const input = calls[0]?.args[0]?.input;
  expect(input?.Bucket).toBe("bucket");
  expect(input?.Key).toBe("yuna78mhz/20260714230000.m4a");
  expect(input?.ContentType).toBe("audio/mp4");
  expect(vi.mocked(createReadStream)).toHaveBeenCalledWith("/tmp/20260714230000-BAYFM78.m4a");
});

test("saveEpisode returns Failure without calling S3 when localPath is missing", async () => {
  const episode = Episode.from({ startedAt: new Date("2026-07-14T14:00:00Z") });

  const result = await saveEpisode("bucket", "yuna78mhz", episode);

  expect(expectFailure(result).message).toBe("localPath is required");
  expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(0);
});

test("saveEpisode returns Failure when the upload fails", async () => {
  s3Mock.on(PutObjectCommand).rejects(new Error("upload failed"));
  const episode = Episode.from({
    startedAt: new Date("2026-07-14T14:00:00Z"),
    localPath: "/tmp/20260714230000-BAYFM78.m4a",
  });

  const result = await saveEpisode("bucket", "yuna78mhz", episode);

  expect(result.isFailure()).toBe(true);
});

test("listEpisodes returns m4a objects sorted by startedAt in descending order", async () => {
  s3Mock.on(ListObjectsV2Command).resolves({
    Contents: [
      { Key: "yuna78mhz/config.json", Size: 10 },
      { Key: "yuna78mhz/index.rss", Size: 20 },
      { Key: "yuna78mhz/20260707230000.m4a", Size: 100 },
      { Key: "yuna78mhz/20260714230000.m4a", Size: 200 },
      { Size: 300 },
    ],
  });

  const result = await listEpisodes("bucket", "yuna78mhz", "https://example.com/");

  const episodes = expectSuccess(result);
  expect(episodes.map((episode) => episode.url)).toStrictEqual([
    "https://example.com/yuna78mhz/20260714230000.m4a",
    "https://example.com/yuna78mhz/20260707230000.m4a",
  ]);
  expect(episodes[0]?.size).toBe(200);
  const calls = s3Mock.commandCalls(ListObjectsV2Command);
  expect(calls[0]?.args[0]?.input).toStrictEqual({
    Bucket: "bucket",
    Prefix: "yuna78mhz/",
  });
});

test("listEpisodes returns Failure when contents is undefined", async () => {
  s3Mock.on(ListObjectsV2Command).resolves({});

  const result = await listEpisodes("bucket", "yuna78mhz", "https://example.com/");

  expect(expectFailure(result).message).toBe("contents is undefined");
});

test("listEpisodes returns Failure when the request fails", async () => {
  s3Mock.on(ListObjectsV2Command).rejects(new Error("access denied"));

  const result = await listEpisodes("bucket", "yuna78mhz", "https://example.com/");

  expect(result.isFailure()).toBe(true);
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

  expect(result.isFailure()).toBe(true);
});
