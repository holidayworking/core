import { execa } from "execa";
import { statSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { recordEpisode } from "../../../lib/constructs/lambda/recorder.ts";
import { createDefinition } from "./fixtures.ts";
import { expectFailure, expectSuccess } from "./helpers.ts";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  statSync: vi.fn(),
  unlinkSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

const execaMock = vi.mocked(execa);
const statSyncMock = vi.mocked(statSync);
const unlinkSyncMock = vi.mocked(unlinkSync);
const writeFileSyncMock = vi.mocked(writeFileSync);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  // Fixed at JST 2026-07-15 (Wed) 00:00; the previous run of "00 23 * * 2" is 7/14 (Tue) 23:00 JST
  vi.setSystemTime(new Date("2026-07-14T15:00:00Z"));
  execaMock.mockResolvedValue(undefined as never);
  statSyncMock.mockReturnValue({ size: 12_345 } as never);
});

afterEach(() => {
  vi.useRealTimers();
});

test("records the previous program schedule and concatenates it into an m4a", async () => {
  const aacPath = `${tmpdir()}/20260714230000-BAYFM78.aac`;
  const m4aPath = `${tmpdir()}/20260714230000-BAYFM78.m4a`;

  const result = await recordEpisode("mail@example.com", "password", createDefinition());

  expect(execaMock).toHaveBeenCalledTimes(3);
  expect(execaMock).toHaveBeenNthCalledWith(1, "rm", ["-f", aacPath]);
  expect(execaMock).toHaveBeenNthCalledWith(
    2,
    "radigo",
    ["rec", "-area", "JP13", "-id", "BAYFM78", "-s", "20260714230000"],
    {
      env: {
        RADIGO_HOME: tmpdir(),
        RADIKO_MAIL: "mail@example.com",
        RADIKO_PASSWORD: "password",
      },
      stdout: "inherit",
      stderr: "inherit",
    },
  );

  const listPath = writeFileSyncMock.mock.calls[0]?.[0];
  expect(String(listPath)).toMatch(/concat-[0-9a-f-]+\.txt$/);
  expect(writeFileSyncMock.mock.calls[0]?.[1]).toBe(`file '${aacPath}'\n`);
  expect(execaMock).toHaveBeenNthCalledWith(
    3,
    "ffmpeg",
    ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", m4aPath],
    { stdout: "inherit", stderr: "inherit" },
  );
  expect(unlinkSyncMock).toHaveBeenCalledWith(listPath);
  expect(statSyncMock).toHaveBeenCalledWith(m4aPath);

  const episode = expectSuccess(result);
  expect(episode.station).toBe("BAYFM78");
  expect(episode.startedAt.getTime()).toBe(Date.parse("2026-07-14T23:00:00+09:00"));
  expect(episode.size).toBe(12_345);
  expect(episode.localPath).toBe(m4aPath);
});

test("records every program schedule and uses the first start time", async () => {
  const definition = createDefinition();
  // The previous runs are 7/14 (Tue) 23:00 and 7/13 (Mon) 22:00
  definition.programSchedules = ["00 23 * * 2", "00 22 * * 1"];
  const firstAacPath = `${tmpdir()}/20260714230000-BAYFM78.aac`;
  const secondAacPath = `${tmpdir()}/20260713220000-BAYFM78.aac`;

  const result = await recordEpisode("mail@example.com", "password", definition);

  // rm + radigo for each of the 2 programs, plus a single ffmpeg run
  expect(execaMock).toHaveBeenCalledTimes(5);
  expect(writeFileSyncMock.mock.calls[0]?.[1]).toBe(
    `file '${firstAacPath}'\nfile '${secondAacPath}'\n`,
  );

  const episode = expectSuccess(result);
  expect(episode.startedAt.getTime()).toBe(Date.parse("2026-07-14T23:00:00+09:00"));
  expect(episode.localPath).toBe(`${tmpdir()}/20260714230000-BAYFM78.m4a`);
});

test("returns Failure when radigo fails", async () => {
  execaMock.mockImplementation(((command: string) =>
    command === "radigo"
      ? Promise.reject(new Error("radigo failed"))
      : Promise.resolve()) as never);

  const result = await recordEpisode("mail@example.com", "password", createDefinition());

  expect(expectFailure(result).message).toBe("radigo failed");
});

test("returns Failure for an invalid program schedule", async () => {
  const definition = createDefinition();
  definition.programSchedules = ["invalid cron"];

  const result = await recordEpisode("mail@example.com", "password", definition);

  expect(result.isFailure()).toBe(true);
  expect(execaMock).not.toHaveBeenCalled();
});

test("returns Failure when the recorded file cannot be read", async () => {
  statSyncMock.mockImplementation(() => {
    throw new Error("stat failed");
  });

  const result = await recordEpisode("mail@example.com", "password", createDefinition());

  expect(expectFailure(result).message).toBe("stat failed");
});
