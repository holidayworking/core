import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { createReadStream } from "fs";

import type { Definition } from "./definition.ts";
import type { Episode } from "./episode.ts";

import { Failure, Success } from "./result.ts";

const client = new S3Client({});

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
    if (e instanceof Error) {
      return new Failure(e);
    } else {
      return new Failure(new Error());
    }
  }
};

export const saveEpisode = async (bucket: string, id: string, episode: Episode) => {
  try {
    await client.send(
      new PutObjectCommand({
        Body: createReadStream(episode.localPath),
        Bucket: bucket,
        ContentType: "audio/mp4",
        Key: `${id}/${format(toZonedTime(episode.startedAt, "Asia/Tokyo"), "yyyyMMdd")}.m4a`,
        Metadata: {
          startedAt: episode.startedAt.toISOString(),
        },
      }),
    );
    return new Success("");
  } catch (e) {
    if (e instanceof Error) {
      return new Failure(e);
    } else {
      return new Failure(new Error());
    }
  }
};
