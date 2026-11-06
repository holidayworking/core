import { Success } from "@core/utils";
import { expectFailure, expectSuccess } from "@core/utils/test";
import { execa } from "execa";
import { tmpdir } from "os";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { Episode } from "../../../lib/constructs/lambda/episode.ts";
import { recordRadikoEpisode } from "../../../lib/constructs/lambda/radiko.ts";
import { toEpisode } from "../../../lib/constructs/lambda/recording.ts";
import { createDefinition } from "./fixtures.ts";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

vi.mock("../../../lib/constructs/lambda/recording.ts", () => ({
  toEpisode: vi.fn(),
}));

const execaMock = vi.mocked(execa);
const toEpisodeMock = vi.mocked(toEpisode);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  // Fixed at JST 2026-07-15 (Wed) 00:00; the previous run of "00 23 * * 2" is 7/14 (Tue) 23:00 JST
  vi.setSystemTime(new Date("2026-07-14T15:00:00Z"));
  execaMock.mockResolvedValue(undefined as never);
  toEpisodeMock.mockImplementation(
    async (parts, { startedAt, station }) =>
      new Success(
        Episode.from({
          station,
          startedAt,
          size: 12_345,
          localPath: parts[0]?.path.replace(/\.aac$/, ".m4a"),
        }),
      ),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

test("records the previous program schedule and converts it into an m4a", async () => {
  const aacPath = `${tmpdir()}/20260714230000-BAYFM78.aac`;
  const m4aPath = `${tmpdir()}/20260714230000-BAYFM78.m4a`;

  const result = await recordRadikoEpisode("mail@example.com", "password", createDefinition());

  expect(execaMock).toHaveBeenCalledTimes(2);
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
  expect(toEpisodeMock).toHaveBeenCalledWith([{ path: aacPath, title: "7/14 23:00" }], {
    startedAt: new Date("2026-07-14T23:00:00+09:00"),
    station: "BAYFM78",
  });

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

  const result = await recordRadikoEpisode("mail@example.com", "password", definition);

  // rm + radigo for each of the 2 programs
  expect(execaMock).toHaveBeenCalledTimes(4);
  expect(toEpisodeMock.mock.calls[0]?.[0]).toEqual([
    { path: `${tmpdir()}/20260714230000-BAYFM78.aac`, title: "7/14 23:00" },
    { path: `${tmpdir()}/20260713220000-BAYFM78.aac`, title: "7/13 22:00" },
  ]);

  const episode = expectSuccess(result);
  expect(episode.startedAt.getTime()).toBe(Date.parse("2026-07-14T23:00:00+09:00"));
  expect(episode.localPath).toBe(`${tmpdir()}/20260714230000-BAYFM78.m4a`);
});

test("returns Failure when radigo fails", async () => {
  execaMock.mockImplementation(((command: string) =>
    command === "radigo"
      ? Promise.reject(new Error("radigo failed"))
      : Promise.resolve()) as never);

  const result = await recordRadikoEpisode("mail@example.com", "password", createDefinition());

  expect(expectFailure(result).message).toBe("radigo failed");
});

test("returns Failure for an invalid program schedule", async () => {
  const definition = createDefinition();
  definition.programSchedules = ["invalid cron"];

  const result = await recordRadikoEpisode("mail@example.com", "password", definition);

  expect(result.isFailure()).toBe(true);
  expect(execaMock).not.toHaveBeenCalled();
});
