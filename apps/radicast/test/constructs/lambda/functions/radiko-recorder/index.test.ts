import { Logger } from "@aws-lambda-powertools/logger";
import { getParameter } from "@aws-lambda-powertools/parameters/ssm";
import { Failure, Success } from "@core/utils";
import { rmSync } from "fs";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { findDefinition } from "../../../../../lib/constructs/lambda/definition.ts";
import { Episode, saveEpisode } from "../../../../../lib/constructs/lambda/episode.ts";
import { handler } from "../../../../../lib/constructs/lambda/functions/radiko-recorder/index.ts";
import { recordRadikoEpisode } from "../../../../../lib/constructs/lambda/radiko.ts";
import { recordRadiruEpisode } from "../../../../../lib/constructs/lambda/radiru.ts";
import { createContext, createDefinition, createRadiruDefinition } from "../../fixtures.ts";

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  rmSync: vi.fn(),
}));
vi.mock("@aws-lambda-powertools/parameters/ssm", () => ({
  getParameter: vi.fn(),
}));
vi.mock("../../../../../lib/constructs/lambda/definition.ts");
vi.mock("../../../../../lib/constructs/lambda/episode.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../lib/constructs/lambda/episode.ts")>()),
  saveEpisode: vi.fn(),
}));
vi.mock("../../../../../lib/constructs/lambda/radiko.ts");
vi.mock("../../../../../lib/constructs/lambda/radiru.ts");

const getParameterMock = vi.mocked(getParameter);
const rmSyncMock = vi.mocked(rmSync);
const findDefinitionMock = vi.mocked(findDefinition);
const recordRadikoEpisodeMock = vi.mocked(recordRadikoEpisode);
const recordRadiruEpisodeMock = vi.mocked(recordRadiruEpisode);
const saveEpisodeMock = vi.mocked(saveEpisode);

const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

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
  recordRadikoEpisodeMock.mockResolvedValue(new Success(episode));
  recordRadiruEpisodeMock.mockResolvedValue(new Success(episode));
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
  expect(recordRadikoEpisodeMock).toHaveBeenCalledWith(
    "mail@example.com",
    "secret",
    createDefinition(),
  );
  expect(saveEpisodeMock).toHaveBeenCalledWith("bucket", "yuna78mhz", episode);
  expect(rmSyncMock).toHaveBeenCalledWith("/tmp/20260714230000-BAYFM78.m4a", { force: true });
  expect(recordRadiruEpisodeMock).not.toHaveBeenCalled();
  expect(errorSpy).not.toHaveBeenCalled();
});

test("records らじる★らじる episodes without the radiko credentials", async () => {
  findDefinitionMock.mockResolvedValue(new Success(createRadiruDefinition()));

  await handler({ id: "radirer" }, createContext());

  expect(getParameterMock).not.toHaveBeenCalled();
  expect(recordRadikoEpisodeMock).not.toHaveBeenCalled();
  expect(recordRadiruEpisodeMock).toHaveBeenCalledWith(createRadiruDefinition());
  expect(saveEpisodeMock).toHaveBeenCalledWith("bucket", "radirer", episode);
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

  expect(errorSpy).toHaveBeenCalledWith(
    "unexpected error",
    new Error("Radiko credentials are not configured"),
  );
  expect(recordRadikoEpisodeMock).not.toHaveBeenCalled();
});

test("stops when findDefinition fails", async () => {
  const error = new Error("definition not found");
  findDefinitionMock.mockResolvedValue(new Failure(error));

  await handler({ id: "yuna78mhz" }, createContext());

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
  expect(recordRadikoEpisodeMock).not.toHaveBeenCalled();
});

test("stops when recordRadikoEpisode fails", async () => {
  const error = new Error("could not be recorded");
  recordRadikoEpisodeMock.mockResolvedValue(new Failure(error));

  await handler({ id: "yuna78mhz" }, createContext());

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
  expect(saveEpisodeMock).not.toHaveBeenCalled();
});

test("logs an error when saveEpisode fails", async () => {
  const error = new Error("upload failed");
  saveEpisodeMock.mockResolvedValue(new Failure(error));

  await handler({ id: "yuna78mhz" }, createContext());

  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
  expect(rmSyncMock).toHaveBeenCalledWith("/tmp/20260714230000-BAYFM78.m4a", { force: true });
});
