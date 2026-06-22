import { tz } from "@date-fns/tz";
import { parse } from "date-fns";

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
