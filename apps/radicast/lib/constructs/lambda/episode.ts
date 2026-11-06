import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Failure, Success, toFailure } from "@core/utils";
import { tz } from "@date-fns/tz";
import { format, parse } from "date-fns";
import { createReadStream } from "fs";
import { extname } from "path";

const client = new S3Client({});

export type Episode = {
  station?: string;
  url?: string;
  startedAt: Date;
  size?: number;
  localPath?: string;
};

export const Episode = {
  from({
    station,
    url,
    startedAt,
    size,
    localPath,
  }: {
    station?: string;
    url?: string;
    startedAt?: Date;
    size?: number;
    localPath?: string;
  }): Episode {
    const filename = url
      ?.split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "");
    return {
      station,
      url,
      startedAt: startedAt
        ? startedAt
        : filename
          ? parse(filename, "yyyyMMddHHmmss", new Date(), { in: tz("Asia/Tokyo") })
          : new Date(),
      size,
      localPath,
    };
  },
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
    return toFailure(e);
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
    return toFailure(e);
  }
};
