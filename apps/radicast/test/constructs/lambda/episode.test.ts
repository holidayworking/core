import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { expectFailure, expectSuccess } from "@core/utils/test";
import { mockClient } from "aws-sdk-client-mock";
import { createReadStream } from "fs";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { Episode, listEpisodes, saveEpisode } from "../../../lib/constructs/lambda/episode.ts";

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  createReadStream: vi.fn(() => "dummy stream"),
}));

const s3Mock = mockClient(S3Client);

beforeEach(() => {
  s3Mock.reset();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

test("derives startedAt from the url filename as JST", () => {
  const episode = Episode.from({
    url: "https://example.com/yuna78mhz/20260714230000.m4a",
    size: 123,
  });

  expect(episode.startedAt.getTime()).toBe(Date.parse("2026-07-14T23:00:00+09:00"));
  expect(episode.url).toBe("https://example.com/yuna78mhz/20260714230000.m4a");
  expect(episode.size).toBe(123);
});

test("prefers an explicit startedAt over the url filename", () => {
  const startedAt = new Date("2026-01-01T00:00:00Z");

  const episode = Episode.from({
    url: "https://example.com/yuna78mhz/20260714230000.m4a",
    startedAt,
  });

  expect(episode.startedAt).toBe(startedAt);
});

test("falls back to the current time without url and startedAt", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-18T12:34:56Z"));

  const episode = Episode.from({});

  expect(episode.startedAt.getTime()).toBe(Date.parse("2026-07-18T12:34:56Z"));
});

test("keeps station, size and localPath as passed", () => {
  const episode = Episode.from({
    station: "BAYFM78",
    startedAt: new Date("2026-07-14T14:00:00Z"),
    size: 456,
    localPath: "/tmp/20260714230000-BAYFM78.m4a",
  });

  expect(episode.station).toBe("BAYFM78");
  expect(episode.size).toBe(456);
  expect(episode.localPath).toBe("/tmp/20260714230000-BAYFM78.m4a");
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

  expect(expectFailure(result).message).toBe("upload failed");
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

  expect(expectFailure(result).message).toBe("access denied");
});
