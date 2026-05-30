import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import { createReadStream } from "fs";
import { extname } from "path";

import type { Definition } from "./definition.ts";

import { Episode } from "./episode.ts";
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
    if (!episode.localPath) {
      return new Failure(new Error("localPath is required"));
    }
    await client.send(
      new PutObjectCommand({
        Body: createReadStream(episode.localPath),
        Bucket: bucket,
        ContentType: "audio/mp4",
        Key: `${id}/${format(episode.startedAt, "yyyyMMddHHmmss", { in: tz("Asia/Tokyo") })}.m4a`,
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

export const listEpisodes = async (bucket: string, id: string, url: string) => {
  try {
    const response = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: `${id}/` }),
    );
    if (!response.Contents) {
      return new Failure(new Error("contents is undefined"));
    }
    const episodes = response.Contents.filter((content) => {
      const key = content.Key;
      if (!key) {
        return false;
      }
      return [".m4a"].includes(extname(key));
    })
      .map((content) =>
        Episode.from({
          url: `${url}${content.Key}`,
          size: content.Size,
        }),
      )
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    return new Success(episodes);
  } catch (e) {
    if (e instanceof Error) {
      return new Failure(e);
    } else {
      return new Failure(new Error());
    }
  }
};

export const saveFeed = async (bucket: string, id: string, feed: string) => {
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `${id}/index.rss`,
        Body: feed,
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
