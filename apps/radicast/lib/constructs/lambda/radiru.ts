import { toFailure } from "@core/utils";
import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import { tmpdir } from "os";

import { previousStartTimes, type RadiruDefinition } from "./definition.ts";
import { downloadHls } from "./hls.ts";
import { fetchJson } from "./http.ts";
import { removeParts, toEpisode } from "./media.ts";

type SeriesResponse = {
  title?: string;
  episodes?: {
    program_title?: string;
    stream_url?: string;
    aa_contents_id?: string;
  }[];
};

export type RadiruEpisode = {
  title: string;
  streamUrl: string;
  startedAt: Date;
};

export const seriesUrl = ({ seriesSiteId, cornerSiteId }: RadiruDefinition) =>
  `https://www.nhk.or.jp/radio-api/app/v1/web/ondemand/series?site_id=${encodeURIComponent(seriesSiteId)}&corner_site_id=${encodeURIComponent(cornerSiteId)}`;

export const recordRadiruEpisode = async (definition: RadiruDefinition) => {
  try {
    const startTimes = previousStartTimes(definition);
    const available = parseSeries(await fetchJson<SeriesResponse>(seriesUrl(definition)));
    // Resolve every episode before downloading so that nothing is recorded
    // while a later one is not available yet.
    const episodes = startTimes.map((startTime) => {
      const episode = findEpisode(available, startTime);
      if (!episode) {
        throw new Error(
          `episode starting at ${format(startTime, "yyyy-MM-dd HH:mm", { in: tz("Asia/Tokyo") })} is not available`,
        );
      }
      return episode;
    });

    const parts = episodes.map(({ startedAt, title }) => {
      const startedAtStr = format(startedAt, "yyyyMMddHHmmss", { in: tz("Asia/Tokyo") });
      return { path: `${tmpdir()}/${startedAtStr}-${definition.seriesSiteId}.aac`, title };
    });
    // Wait for every download to settle so that none of them writes a part
    // after the parts are removed.
    const results = await Promise.allSettled(
      episodes.map(({ streamUrl }, i) => downloadHls(streamUrl, parts[i]!.path)),
    );
    const rejected = results.find((result) => result.status === "rejected");
    if (rejected) {
      removeParts(parts);
      throw rejected.reason;
    }
    return await toEpisode(parts, { startedAt: startTimes[0] });
  } catch (e) {
    return toFailure(e);
  }
};

// The on-demand start time can be a few seconds off the program schedule
// (e.g. 11:00:03 for an 11:00 program), so the closest episode within this
// tolerance is matched.
const START_TIME_TOLERANCE_MS = 5 * 60 * 1000;

export const findEpisode = (episodes: RadiruEpisode[], startTime: Date) => {
  const diff = (episode: RadiruEpisode) =>
    Math.abs(episode.startedAt.getTime() - startTime.getTime());
  return episodes
    .filter((episode) => diff(episode) <= START_TIME_TOLERANCE_MS)
    .sort((a, b) => diff(a) - diff(b))[0];
};

export const parseSeries = (series: SeriesResponse) => {
  const seriesTitle = series.title?.trim() ?? "";
  const episodes: RadiruEpisode[] = [];
  for (const episode of series.episodes ?? []) {
    // e.g. "[radio]vod;<title>;r1,130;2026110172365;2026-11-01T20:05:00+09:00_2026-11-01T20:55:00+09:00"
    const startedAt = episode.aa_contents_id?.match(
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2})_/,
    )?.[1];
    if (!startedAt || !episode.stream_url) {
      continue;
    }
    const programTitle = episode.program_title?.trim() ?? "";
    // Drop the series title prefix, e.g. "らじらー! サンデー 8時台 ..." -> "8時台 ..."
    const title =
      seriesTitle && programTitle.startsWith(seriesTitle)
        ? programTitle.slice(seriesTitle.length).trim()
        : programTitle;
    episodes.push({
      title: title || programTitle,
      streamUrl: episode.stream_url,
      startedAt: new Date(startedAt),
    });
  }
  return episodes;
};
