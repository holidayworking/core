import { CronExpressionParser } from "cron-parser";

type BaseDefinition = {
  id: string;
  title: string;
  author: string;
  image: string;
  programSchedules: string[];
  executionSchedule: string;
};

export type RadikoDefinition = BaseDefinition & {
  service?: "radiko";
  area: string;
  station: string;
};

export type RadiruDefinition = BaseDefinition & {
  service: "radiru";
  seriesSiteId: string;
  cornerSiteId: string;
};

export type Definition = RadikoDefinition | RadiruDefinition;

// The most recent start time of each program schedule, in JST.
export const previousStartTimes = ({ programSchedules }: Definition) =>
  programSchedules.map((programSchedule) =>
    CronExpressionParser.parse(programSchedule, { tz: "Asia/Tokyo" }).prev().toDate(),
  );
