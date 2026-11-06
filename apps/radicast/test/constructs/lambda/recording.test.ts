import { expectFailure, expectSuccess } from "@core/utils/test";
import { execa } from "execa";
import { rmSync, statSync, writeFileSync } from "fs";
import { beforeEach, expect, test, vi } from "vite-plus/test";

import { concat, toEpisode } from "../../../lib/constructs/lambda/recording.ts";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  rmSync: vi.fn(),
  statSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

const execaMock = vi.mocked(execa);
const rmSyncMock = vi.mocked(rmSync);
const statSyncMock = vi.mocked(statSync);
const writeFileSyncMock = vi.mocked(writeFileSync);

const durations: Record<string, string> = {
  "/tmp/a.aac": "0.021333\n0.021334\n",
  "/tmp/b.aac": "1.5\n",
};

beforeEach(() => {
  vi.clearAllMocks();
  execaMock.mockImplementation((async (command: string, args: string[]) =>
    command === "ffprobe" ? { stdout: durations[args.at(-1) ?? ""] } : {}) as never);
});

test("returns undefined when there are no parts", async () => {
  expect(await concat([])).toBeUndefined();
  expect(execaMock).not.toHaveBeenCalled();
});

test("converts a single part without chapters", async () => {
  const m4aPath = await concat([{ path: "/tmp/a.aac", title: "a" }]);

  expect(m4aPath).toBe("/tmp/a.m4a");
  expect(execaMock).toHaveBeenCalledTimes(1);
  expect(execaMock).toHaveBeenCalledWith(
    "ffmpeg",
    ["-y", "-i", "/tmp/a.aac", "-c", "copy", "/tmp/a.m4a"],
    { stdout: "inherit", stderr: "inherit" },
  );
  expect(writeFileSyncMock).not.toHaveBeenCalled();
});

test("concatenates multiple parts and adds a chapter per part", async () => {
  const m4aPath = await concat([
    { path: "/tmp/a.aac", title: "8時台 = A; #1" },
    { path: "/tmp/b.aac", title: "9時台" },
  ]);

  expect(m4aPath).toBe("/tmp/a.m4a");
  expect(execaMock.mock.calls.map(([command, args]) => [command, args])).toEqual([
    ["ffmpeg", ["-y", "-i", "concat:/tmp/a.aac|/tmp/b.aac", "-c", "copy", "/tmp/a-joined.m4a"]],
    [
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "a:0",
        "-show_entries",
        "packet=duration_time",
        "-of",
        "csv=p=0",
        "/tmp/a.aac",
      ],
    ],
    [
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "a:0",
        "-show_entries",
        "packet=duration_time",
        "-of",
        "csv=p=0",
        "/tmp/b.aac",
      ],
    ],
    [
      "ffmpeg",
      [
        "-y",
        "-i",
        "/tmp/a-joined.m4a",
        "-i",
        "/tmp/a-chapters.txt",
        "-map",
        "0",
        "-map_metadata",
        "1",
        "-map_chapters",
        "1",
        "-c",
        "copy",
        "/tmp/a.m4a",
      ],
    ],
  ]);
  expect(writeFileSyncMock).toHaveBeenCalledWith(
    "/tmp/a-chapters.txt",
    [
      ";FFMETADATA1",
      "[CHAPTER]",
      "TIMEBASE=1/1000",
      "START=0",
      "END=43",
      "title=8時台 \\= A\\; \\#1",
      "[CHAPTER]",
      "TIMEBASE=1/1000",
      "START=43",
      "END=1543",
      "title=9時台",
      "",
    ].join("\n"),
  );
  expect(rmSyncMock).toHaveBeenCalledWith("/tmp/a-chapters.txt", { force: true });
  expect(rmSyncMock).toHaveBeenCalledWith("/tmp/a-joined.m4a", { force: true });
});

test("removes the intermediate files when ffmpeg fails", async () => {
  execaMock.mockRejectedValue(new Error("ffmpeg failed"));

  await expect(
    concat([
      { path: "/tmp/a.aac", title: "a" },
      { path: "/tmp/b.aac", title: "b" },
    ]),
  ).rejects.toThrow("ffmpeg failed");

  expect(rmSyncMock).toHaveBeenCalledWith("/tmp/a-chapters.txt", { force: true });
  expect(rmSyncMock).toHaveBeenCalledWith("/tmp/a-joined.m4a", { force: true });
});

test("toEpisode converts the parts into an episode", async () => {
  statSyncMock.mockReturnValue({ size: 12_345 } as never);
  const startedAt = new Date("2026-07-14T23:00:00+09:00");

  const result = await toEpisode([{ path: "/tmp/a.aac", title: "a" }], {
    startedAt,
    station: "BAYFM78",
  });

  expect(statSyncMock).toHaveBeenCalledWith("/tmp/a.m4a");
  expect(rmSyncMock).toHaveBeenCalledWith("/tmp/a.aac", { force: true });
  const episode = expectSuccess(result);
  expect(episode.station).toBe("BAYFM78");
  expect(episode.startedAt).toBe(startedAt);
  expect(episode.size).toBe(12_345);
  expect(episode.localPath).toBe("/tmp/a.m4a");
});

test("toEpisode returns Failure when there are no parts", async () => {
  const result = await toEpisode([], {});

  expect(expectFailure(result).message).toBe("could not be recorded");
});

test("toEpisode removes the parts when the conversion fails", async () => {
  execaMock.mockRejectedValue(new Error("ffmpeg failed"));

  await expect(
    toEpisode(
      [
        { path: "/tmp/a.aac", title: "a" },
        { path: "/tmp/b.aac", title: "b" },
      ],
      {},
    ),
  ).rejects.toThrow("ffmpeg failed");

  expect(rmSyncMock).toHaveBeenCalledWith("/tmp/a.aac", { force: true });
  expect(rmSyncMock).toHaveBeenCalledWith("/tmp/b.aac", { force: true });
});
