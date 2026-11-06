import { Failure, Success } from "@core/utils";
import { execa } from "execa";
import { rmSync, statSync, writeFileSync } from "fs";

import { Episode } from "./episode.ts";

export type Part = {
  path: string;
  title: string;
};

const ffmpeg = (args: string[]) =>
  execa("ffmpeg", ["-y", ...args], { stdout: "inherit", stderr: "inherit" });

// Converts the AAC (ADTS) parts into a single m4a. Chapters are added only
// when multiple parts are concatenated, one per part.
export const concat = async (parts: Part[]) => {
  const firstPath = parts[0]?.path;
  if (!firstPath) {
    return undefined;
  }
  const m4aPath = firstPath.replace(/\.aac$/, ".m4a");

  if (parts.length === 1) {
    await ffmpeg(["-i", firstPath, "-c", "copy", m4aPath]);
    return m4aPath;
  }

  // ADTS is self-framing, so the parts are joined as one byte stream with the
  // concat protocol. The concat demuxer would instead offset each part by its
  // duration estimated from the bitrate, which shifts timestamps.
  //
  // Chapters are added in a second pass: the raw AAC demuxer uses a 1/28224000
  // time base, which overflows the QuickTime chapter track for programs longer
  // than a few minutes, whereas the m4a from the first pass uses the sample
  // rate.
  const joinedPath = firstPath.replace(/\.aac$/, "-joined.m4a");
  const metadataPath = firstPath.replace(/\.aac$/, "-chapters.txt");
  try {
    await ffmpeg([
      "-i",
      `concat:${parts.map(({ path }) => path).join("|")}`,
      "-c",
      "copy",
      joinedPath,
    ]);
    writeFileSync(metadataPath, await buildChapterMetadata(parts));
    await ffmpeg([
      "-i",
      joinedPath,
      "-i",
      metadataPath,
      "-map",
      "0",
      "-map_metadata",
      "1",
      "-map_chapters",
      "1",
      "-c",
      "copy",
      m4aPath,
    ]);
    return m4aPath;
  } finally {
    rmSync(metadataPath, { force: true });
    rmSync(joinedPath, { force: true });
  }
};

// Removes the recorded parts from /tmp, which is kept between invocations on
// a warm Lambda container.
export const removeParts = (parts: Part[]) => {
  for (const { path } of parts) {
    rmSync(path, { force: true });
  }
};

// Converts the recorded parts into an m4a episode starting at startedAt. The
// parts are removed afterwards.
export const toEpisode = async (
  parts: Part[],
  { startedAt, station }: { startedAt?: Date; station?: string },
) => {
  try {
    const m4aPath = await concat(parts);
    if (!m4aPath) {
      return new Failure(new Error("could not be recorded"));
    }
    const { size } = statSync(m4aPath);
    return new Success(Episode.from({ station, startedAt, size, localPath: m4aPath }));
  } finally {
    removeParts(parts);
  }
};

const buildChapterMetadata = async (parts: Part[]) => {
  const durations = await Promise.all(parts.map(({ path }) => probeDurationMs(path)));
  let start = 0;
  const chapters = parts.map(({ title }, i) => {
    const end = start + (durations[i] ?? 0);
    const chapter = `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${start}\nEND=${end}\ntitle=${escape(title)}\n`;
    start = end;
    return chapter;
  });
  return `;FFMETADATA1\n${chapters.join("")}`;
};

// The duration in the header of an ADTS stream is only estimated from the
// bitrate (off by tens of seconds for an hour-long program), so sum the
// per-packet durations instead.
const probeDurationMs = async (path: string) => {
  const { stdout } = await execa("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "a:0",
    "-show_entries",
    "packet=duration_time",
    "-of",
    "csv=p=0",
    path,
  ]);
  const seconds = String(stdout)
    .split("\n")
    .map((line) => Number.parseFloat(line))
    .filter((value) => Number.isFinite(value))
    .reduce((sum, value) => sum + value, 0);
  return Math.round(seconds * 1000);
};

// Special characters in FFMETADATA values must be escaped with a backslash.
const escape = (value: string) => value.replace(/[=;#\\\n]/g, (c) => `\\${c}`);
