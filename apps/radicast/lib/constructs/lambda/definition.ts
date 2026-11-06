import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Failure, Success, toFailure } from "@core/utils";
import { CronExpressionParser } from "cron-parser";

const client = new S3Client({});

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

export const findDefinition = async (bucket: string, id: string) => {
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: `${id}/config.json`,
      }),
    );
    const body = response.Body;
    if (!body) {
      return new Failure(new Error("body is undefined"));
    }
    const str = await body.transformToString();
    const definition: Definition = JSON.parse(str);
    return new Success(definition);
  } catch (e) {
    return toFailure(e);
  }
};
