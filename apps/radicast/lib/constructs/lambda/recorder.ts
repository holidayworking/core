import { toFailure } from "@core/utils";
import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import { execa } from "execa";
import { tmpdir } from "os";

import { previousStartTimes, type RadikoDefinition } from "./definition.ts";
import { toEpisode } from "./media.ts";

export const recordEpisode = async (
  email: string,
  password: string,
  definition: RadikoDefinition,
) => {
  try {
    const startTimes = previousStartTimes(definition);
    const parts = await Promise.all(
      startTimes.map(async (startTime) => ({
        path: await record(email, password, definition.area, definition.station, startTime),
        title: format(startTime, "M/d HH:mm", { in: tz("Asia/Tokyo") }),
      })),
    );
    return await toEpisode(parts, { startedAt: startTimes[0], station: definition.station });
  } catch (e) {
    return toFailure(e);
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
