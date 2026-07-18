import { Logger } from "@aws-lambda-powertools/logger";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { findBasicAuthenticationCredential } from "../../../../../lib/constructs/lambda/cloudfront-keyvaluestore.ts";
import { Episode } from "../../../../../lib/constructs/lambda/episode.ts";
import { handler } from "../../../../../lib/constructs/lambda/functions/feed-generator/index.ts";
import { Failure, Success } from "../../../../../lib/constructs/lambda/result.ts";
import { findDefinition, listEpisodes, saveFeed } from "../../../../../lib/constructs/lambda/s3.ts";
import { createContext, createDefinition, createS3Event, kvsArn } from "../../fixtures.ts";
import { spyOnLoggerError } from "../../helpers.ts";

vi.mock("../../../../../lib/constructs/lambda/cloudfront-keyvaluestore.ts");
vi.mock("../../../../../lib/constructs/lambda/s3.ts");

const findBasicAuthenticationCredentialMock = vi.mocked(findBasicAuthenticationCredential);
const findDefinitionMock = vi.mocked(findDefinition);
const listEpisodesMock = vi.mocked(listEpisodes);
const saveFeedMock = vi.mocked(saveFeed);

const errorSpy = spyOnLoggerError();
vi.spyOn(Logger.prototype, "info").mockImplementation(() => {});

const episode = Episode.from({
  url: "https://radicast:secret@podcast.example.com/yuna78mhz/20260714230000.m4a",
  size: 123,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DOMAIN_NAME", "podcast.example.com");
  vi.stubEnv("BASIC_AUTHENTICATION_CREDENTIAL_KEY_VALUE_STORE_ARN", kvsArn);
  findBasicAuthenticationCredentialMock.mockResolvedValue(
    new Success({ username: "radicast", password: "secret" }),
  );
  findDefinitionMock.mockResolvedValue(new Success(createDefinition()));
  listEpisodesMock.mockResolvedValue(new Success([episode]));
  saveFeedMock.mockResolvedValue(new Success(""));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("generates and saves the feed for the updated definition", async () => {
  await handler(
    createS3Event({ bucket: "bucket", key: "yuna78mhz/20260714230000.m4a" }),
    createContext(),
  );

  expect(findBasicAuthenticationCredentialMock).toHaveBeenCalledWith(kvsArn);
  expect(findDefinitionMock).toHaveBeenCalledWith("bucket", "yuna78mhz");
  expect(listEpisodesMock).toHaveBeenCalledWith(
    "bucket",
    "yuna78mhz",
    "https://radicast:secret@podcast.example.com/",
  );
  expect(saveFeedMock).toHaveBeenCalledWith("bucket", "yuna78mhz", expect.any(String));

  const feed = saveFeedMock.mock.calls[0]?.[2];
  expect(feed).toContain("<title>乃木坂46 柴田柚菜のDreaming time</title>");
  expect(feed).toContain("<itunes:author>柴田柚菜</itunes:author>");
  expect(feed).toContain(
    '<itunes:image href="https://program-static.cf.radiko.jp/4shbilswvp.jpg" />',
  );
  expect(feed).toContain("<title>20260714230000</title>");
  expect(feed).toContain("<pubDate>Tue, 14 Jul 2026 14:00:00 +0000</pubDate>");
  expect(feed).toContain(
    '<enclosure url="https://radicast:secret@podcast.example.com/yuna78mhz/20260714230000.m4a" length="123" type="audio/mp4; charset=binary" />',
  );
  expect(errorSpy).not.toHaveBeenCalled();
});

test("generates a feed for every record", async () => {
  await handler(
    createS3Event(
      { bucket: "bucket", key: "yuna78mhz/20260714230000.m4a" },
      { bucket: "bucket", key: "nogizaka46nono/20260712180000.m4a" },
    ),
    createContext(),
  );

  expect(findDefinitionMock).toHaveBeenCalledWith("bucket", "yuna78mhz");
  expect(findDefinitionMock).toHaveBeenCalledWith("bucket", "nogizaka46nono");
  expect(saveFeedMock).toHaveBeenCalledTimes(2);
});

test("logs an error when DOMAIN_NAME is not set", async () => {
  vi.stubEnv("DOMAIN_NAME", undefined);

  await handler(
    createS3Event({ bucket: "bucket", key: "yuna78mhz/20260714230000.m4a" }),
    createContext(),
  );

  expect(errorSpy).toHaveBeenCalledWith("Environment variable DOMAIN_NAME is not set");
  expect(findBasicAuthenticationCredentialMock).not.toHaveBeenCalled();
});

test("logs an error when the key value store ARN is not set", async () => {
  vi.stubEnv("BASIC_AUTHENTICATION_CREDENTIAL_KEY_VALUE_STORE_ARN", undefined);

  await handler(
    createS3Event({ bucket: "bucket", key: "yuna78mhz/20260714230000.m4a" }),
    createContext(),
  );

  expect(errorSpy).toHaveBeenCalledWith(
    "Environment variable BASIC_AUTHENTICATION_CREDENTIAL_KEY_VALUE_STORE_ARN is not set",
  );
  expect(findBasicAuthenticationCredentialMock).not.toHaveBeenCalled();
});

test("stops when findBasicAuthenticationCredential fails", async () => {
  const error = new Error("credential not found");
  findBasicAuthenticationCredentialMock.mockResolvedValue(new Failure(error));

  await handler(
    createS3Event({ bucket: "bucket", key: "yuna78mhz/20260714230000.m4a" }),
    createContext(),
  );

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
  expect(findDefinitionMock).not.toHaveBeenCalled();
});

test("stops when findDefinition fails", async () => {
  const error = new Error("definition not found");
  findDefinitionMock.mockResolvedValue(new Failure(error));

  await handler(
    createS3Event({ bucket: "bucket", key: "yuna78mhz/20260714230000.m4a" }),
    createContext(),
  );

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
  expect(listEpisodesMock).not.toHaveBeenCalled();
});

test("stops when listEpisodes fails", async () => {
  const error = new Error("list failed");
  listEpisodesMock.mockResolvedValue(new Failure(error));

  await handler(
    createS3Event({ bucket: "bucket", key: "yuna78mhz/20260714230000.m4a" }),
    createContext(),
  );

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
  expect(saveFeedMock).not.toHaveBeenCalled();
});

test("logs an error when saveFeed fails", async () => {
  const error = new Error("upload failed");
  saveFeedMock.mockResolvedValue(new Failure(error));

  await handler(
    createS3Event({ bucket: "bucket", key: "yuna78mhz/20260714230000.m4a" }),
    createContext(),
  );

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
});
