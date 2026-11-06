import { toFailure } from "@core/utils";
import { tz } from "@date-fns/tz";
import { createDecipheriv } from "crypto";
import { format } from "date-fns";
import { writeFileSync } from "fs";
import { tmpdir } from "os";

import { previousStartTimes, type RadiruDefinition } from "./definition.ts";
import { removeParts, toEpisode } from "./recording.ts";

type SeriesResponse = {
  title?: string;
  episodes?: {
    program_title?: string;
    stream_url?: string;
    aa_contents_id?: string;
  }[];
};

type RadiruEpisode = {
  title: string;
  streamUrl: string;
  startedAt: Date;
};

type HlsSegment = {
  url: string;
  sequence: number;
  key?: {
    method: string;
    uri?: string;
    iv?: string;
  };
};

// The on-demand start time can be a few seconds off the program schedule
// (e.g. 11:00:03 for an 11:00 program), so the closest episode within this
// tolerance is matched.
const START_TIME_TOLERANCE_MS = 5 * 60 * 1000;

const HLS_SEGMENT_CONCURRENCY = 8;

const seriesUrl = ({ seriesSiteId, cornerSiteId }: RadiruDefinition) =>
  `https://www.nhk.or.jp/radio-api/app/v1/web/ondemand/series?site_id=${encodeURIComponent(seriesSiteId)}&corner_site_id=${encodeURIComponent(cornerSiteId)}`;

export const recordRadiruEpisode = async (definition: RadiruDefinition) => {
  try {
    const startTimes = previousStartTimes(definition);
    const available = parseSeriesEpisodes(await fetchJson<SeriesResponse>(seriesUrl(definition)));
    // Resolve every episode before downloading so that nothing is recorded
    // while a later one is not available yet.
    const episodes = startTimes.map((startTime) => {
      const episode = findClosestEpisode(available, startTime);
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

const findClosestEpisode = (episodes: RadiruEpisode[], startTime: Date) => {
  const diff = (episode: RadiruEpisode) =>
    Math.abs(episode.startedAt.getTime() - startTime.getTime());
  return episodes
    .filter((episode) => diff(episode) <= START_TIME_TOLERANCE_MS)
    .sort((a, b) => diff(a) - diff(b))[0];
};

const parseSeriesEpisodes = (series: SeriesResponse) => {
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

// Downloads an HLS stream of packed audio (AAC segments, optionally AES-128
// encrypted) and writes the segments into a single ADTS file. ffmpeg's HLS
// demuxer corrupts packets at some segment boundaries of らじる★らじる streams,
// so the segments are fetched and decrypted here instead.
const downloadHls = async (url: string, outputPath: string) => {
  const playlistUrl = await resolveMediaPlaylistUrl(url);
  const segments = parseMediaPlaylist(await fetchText(playlistUrl), playlistUrl);
  if (segments.length === 0) {
    throw new Error(`no segments found in ${playlistUrl}`);
  }

  const keys = new Map<string, Promise<Buffer>>();
  const fetchKey = (uri: string) => {
    let key = keys.get(uri);
    if (!key) {
      key = fetchBuffer(uri);
      keys.set(uri, key);
    }
    return key;
  };

  const buffers: Buffer[] = [];
  for (let i = 0; i < segments.length; i += HLS_SEGMENT_CONCURRENCY) {
    buffers.push(
      ...(await Promise.all(
        segments.slice(i, i + HLS_SEGMENT_CONCURRENCY).map(async (segment) => {
          const data = await fetchBuffer(segment.url);
          return stripId3(await decryptSegment(data, segment, fetchKey));
        }),
      )),
    );
  }
  writeFileSync(outputPath, Buffer.concat(buffers));
};

const resolveMediaPlaylistUrl = async (url: string) => {
  const lines = splitPlaylistLines(await fetchText(url));
  let best: { bandwidth: number; url: string } | undefined;
  for (const [i, line] of lines.entries()) {
    if (!line.startsWith("#EXT-X-STREAM-INF:")) {
      continue;
    }
    const uri = lines.slice(i + 1).find((l) => !l.startsWith("#"));
    if (!uri) {
      continue;
    }
    const bandwidth = Number(parseHlsAttributes(line).BANDWIDTH ?? 0);
    if (!best || bandwidth > best.bandwidth) {
      best = { bandwidth, url: new URL(uri, url).toString() };
    }
  }
  return best ? best.url : url;
};

const parseMediaPlaylist = (playlist: string, baseUrl: string) => {
  const segments: HlsSegment[] = [];
  let sequence = 0;
  let key: HlsSegment["key"];
  for (const line of splitPlaylistLines(playlist)) {
    if (line.startsWith("#EXT-X-MEDIA-SEQUENCE:")) {
      sequence = Number(line.slice("#EXT-X-MEDIA-SEQUENCE:".length));
    } else if (line.startsWith("#EXT-X-KEY:")) {
      const attributes = parseHlsAttributes(line);
      key = {
        method: attributes.METHOD ?? "NONE",
        uri: attributes.URI ? new URL(attributes.URI, baseUrl).toString() : undefined,
        iv: attributes.IV,
      };
    } else if (!line.startsWith("#")) {
      segments.push({ url: new URL(line, baseUrl).toString(), sequence, key });
      sequence++;
    }
  }
  return segments;
};

const decryptSegment = async (
  data: Buffer,
  segment: HlsSegment,
  fetchKey: (uri: string) => Promise<Buffer>,
) => {
  const { key } = segment;
  if (!key || key.method === "NONE") {
    return data;
  }
  if (key.method !== "AES-128" || !key.uri) {
    throw new Error(`unsupported encryption method: ${key.method}`);
  }
  // Without an explicit IV, the media sequence number is used as a 128-bit
  // big-endian IV (RFC 8216, section 5.2).
  const ivHex = key.iv ? key.iv.replace(/^0x/i, "") : segment.sequence.toString(16);
  const iv = Buffer.from(ivHex.padStart(32, "0"), "hex");
  const decipher = createDecipheriv("aes-128-cbc", await fetchKey(key.uri), iv);
  return Buffer.concat([decipher.update(data), decipher.final()]);
};

// Packed audio segments start with an ID3 tag carrying the timestamp, which
// is not part of the ADTS stream.
const stripId3 = (data: Buffer) => {
  let offset = 0;
  while (data.length >= offset + 10 && data.toString("latin1", offset, offset + 3) === "ID3") {
    const size =
      ((data[offset + 6]! & 0x7f) << 21) |
      ((data[offset + 7]! & 0x7f) << 14) |
      ((data[offset + 8]! & 0x7f) << 7) |
      (data[offset + 9]! & 0x7f);
    const hasFooter = (data[offset + 5]! & 0x10) !== 0;
    offset += 10 + size + (hasFooter ? 10 : 0);
  }
  return data.subarray(offset);
};

const parseHlsAttributes = (line: string) => {
  const attributes: Record<string, string> = {};
  for (const match of line.slice(line.indexOf(":") + 1).matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)) {
    const [, name, value] = match;
    if (name && value !== undefined) {
      attributes[name] = value.replace(/^"|"$/g, "");
    }
  }
  return attributes;
};

const splitPlaylistLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

const fetchOrThrow = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status}`);
  }
  return response;
};

const fetchText = async (url: string) => (await fetchOrThrow(url)).text();

const fetchBuffer = async (url: string) =>
  Buffer.from(await (await fetchOrThrow(url)).arrayBuffer());

const fetchJson = async <T>(url: string) => (await (await fetchOrThrow(url)).json()) as T;
