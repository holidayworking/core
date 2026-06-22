import { tz } from "@date-fns/tz";
import { CronExpressionParser } from "cron-parser";
import { randomUUID } from "crypto";
import { format } from "date-fns";
import { execa } from "execa";
import { statSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import type { Definition } from "./definition.ts";

import { Episode } from "./episode.ts";
import { Failure, Success } from "./result.ts";

export const recordEpisode = async (email: string, password: string, definition: Definition) => {
  try {
    const startTimes = definition.programSchedules.map((programSchedule) => {
      const interval = CronExpressionParser.parse(programSchedule, {
        tz: "Asia/Tokyo",
      });
      return interval.prev().toDate();
    });
    const aacPaths = await Promise.all(
      startTimes.map(
        async (programSchedule) =>
          await record(email, password, definition.area, definition.station, programSchedule),
      ),
    );
    const m4aPath = await concat(aacPaths);
    if (m4aPath) {
      const stat = statSync(m4aPath);
      return new Success(
        Episode.from({
          station: definition.station,
          startedAt: startTimes[0],
          size: stat.size,
          localPath: m4aPath,
        }),
      );
    }
    return new Failure(new Error("could not be recorded"));
  } catch (e) {
    if (e instanceof Error) {
      return new Failure(e);
    } else {
      return new Failure(new Error());
    }
  }
};

const record = async (
  email: string,
  password: string,
  area: string,
  station: string,
  programSchedule: Date,
) => {
  const workDir = tmpdir();
  const programScheduleStr = format(programSchedule, "yyyyMMddHHmmss", { in: tz("Asia/Tokyo") });
  const outputPath = `${workDir}/${programScheduleStr}-${station}.aac`;
  await execa("rm", ["-f", outputPath]);
  await execa("radigo", ["rec", "-area", area, "-id", station, "-s", programScheduleStr], {
    env: {
      RADIGO_HOME: workDir,
      RADIKO_MAIL: email,
      RADIKO_PASSWORD: password,
    },
    stdout: "inherit",
    stderr: "inherit",
  });
  return outputPath;
};

const concat = async (aacPaths: string[]) => {
  const listPath = join(tmpdir(), `concat-${randomUUID()}.txt`);
  try {
    writeFileSync(listPath, aacPaths.map((path) => `file '${path}'\n`).join(""));

    const m4aPath = aacPaths[0]?.replace(/\.aac$/, ".m4a");
    if (m4aPath) {
      await execa(
        "ffmpeg",
        ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", m4aPath],
        {
          stdout: "inherit",
          stderr: "inherit",
        },
      );
    }
    return m4aPath;
  } finally {
    unlinkSync(listPath);
  }
};
