import { getParameter } from "@aws-lambda-powertools/parameters/ssm";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { Episode } from "../../../../../lib/constructs/lambda/episode.ts";
import { handler } from "../../../../../lib/constructs/lambda/functions/radiko-recorder/index.ts";
import { recordEpisode } from "../../../../../lib/constructs/lambda/recorder.ts";
import { Failure, Success } from "../../../../../lib/constructs/lambda/result.ts";
import { findDefinition, saveEpisode } from "../../../../../lib/constructs/lambda/s3.ts";
import { createContext, createDefinition } from "../../fixtures.ts";
import { spyOnLoggerError } from "../../helpers.ts";

vi.mock("@aws-lambda-powertools/parameters/ssm", () => ({
  getParameter: vi.fn(),
}));
vi.mock("../../../../../lib/constructs/lambda/recorder.ts");
vi.mock("../../../../../lib/constructs/lambda/s3.ts");

const getParameterMock = vi.mocked(getParameter);
const findDefinitionMock = vi.mocked(findDefinition);
const recordEpisodeMock = vi.mocked(recordEpisode);
const saveEpisodeMock = vi.mocked(saveEpisode);

const errorSpy = spyOnLoggerError();

const episode = Episode.from({
  station: "BAYFM78",
  startedAt: new Date("2026-07-14T14:00:00Z"),
  size: 12_345,
  localPath: "/tmp/20260714230000-BAYFM78.m4a",
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BUCKET", "bucket");
  getParameterMock.mockImplementation((async (name: string) =>
    name === "/app/radicast/radiko_mail" ? "mail@example.com" : "secret") as never);
  findDefinitionMock.mockResolvedValue(new Success(createDefinition()));
  recordEpisodeMock.mockResolvedValue(new Success(episode));
  saveEpisodeMock.mockResolvedValue(new Success(""));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("records and saves the episode for the given id", async () => {
  await handler({ id: "yuna78mhz" }, createContext());

  expect(getParameterMock).toHaveBeenCalledWith("/app/radicast/radiko_mail");
  expect(getParameterMock).toHaveBeenCalledWith("/app/radicast/radiko_password", {
    decrypt: true,
  });
  expect(findDefinitionMock).toHaveBeenCalledWith("bucket", "yuna78mhz");
  expect(recordEpisodeMock).toHaveBeenCalledWith("mail@example.com", "secret", createDefinition());
  expect(saveEpisodeMock).toHaveBeenCalledWith("bucket", "yuna78mhz", episode);
  expect(errorSpy).not.toHaveBeenCalled();
});

test("logs an error when BUCKET is not set", async () => {
  vi.stubEnv("BUCKET", undefined);

  await handler({ id: "yuna78mhz" }, createContext());

  expect(errorSpy).toHaveBeenCalledWith("Environment variable BUCKET is not set");
  expect(getParameterMock).not.toHaveBeenCalled();
});

test("logs an error when the radiko credentials are not configured", async () => {
  getParameterMock.mockResolvedValue(undefined as never);

  await handler({ id: "yuna78mhz" }, createContext());

  expect(errorSpy).toHaveBeenCalledWith("Radiko credentials are not configured");
  expect(findDefinitionMock).not.toHaveBeenCalled();
});

test("stops when findDefinition fails", async () => {
  const error = new Error("definition not found");
  findDefinitionMock.mockResolvedValue(new Failure(error));

  await handler({ id: "yuna78mhz" }, createContext());

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
  expect(recordEpisodeMock).not.toHaveBeenCalled();
});

test("stops when recordEpisode fails", async () => {
  const error = new Error("could not be recorded");
  recordEpisodeMock.mockResolvedValue(new Failure(error));

  await handler({ id: "yuna78mhz" }, createContext());

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
  expect(saveEpisodeMock).not.toHaveBeenCalled();
});

test("logs an error when saveEpisode fails", async () => {
  const error = new Error("upload failed");
  saveEpisodeMock.mockResolvedValue(new Failure(error));

  await handler({ id: "yuna78mhz" }, createContext());

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
});
