import { createDecipheriv } from "crypto";
import { writeFileSync } from "fs";

import { fetchBuffer, fetchText } from "./http.ts";

type Key = {
  method: string;
  uri?: string;
  iv?: string;
};

type Segment = {
  url: string;
  sequence: number;
  key?: Key;
};

const CONCURRENCY = 8;

// Downloads an HLS stream of packed audio (AAC segments, optionally AES-128
// encrypted) and writes the segments into a single ADTS file. ffmpeg's HLS
// demuxer corrupts packets at some segment boundaries of らじる★らじる streams,
// so the segments are fetched and decrypted here instead.
export const downloadHls = async (url: string, outputPath: string) => {
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
  for (let i = 0; i < segments.length; i += CONCURRENCY) {
    buffers.push(
      ...(await Promise.all(
        segments.slice(i, i + CONCURRENCY).map(async (segment) => {
          const data = await fetchBuffer(segment.url);
          return stripId3(await decrypt(data, segment, fetchKey));
        }),
      )),
    );
  }
  writeFileSync(outputPath, Buffer.concat(buffers));
};

const resolveMediaPlaylistUrl = async (url: string) => {
  const lines = toLines(await fetchText(url));
  let best: { bandwidth: number; url: string } | undefined;
  for (const [i, line] of lines.entries()) {
    if (!line.startsWith("#EXT-X-STREAM-INF:")) {
      continue;
    }
    const uri = lines.slice(i + 1).find((l) => !l.startsWith("#"));
    if (!uri) {
      continue;
    }
    const bandwidth = Number(parseAttributes(line).BANDWIDTH ?? 0);
    if (!best || bandwidth > best.bandwidth) {
      best = { bandwidth, url: new URL(uri, url).toString() };
    }
  }
  return best ? best.url : url;
};

export const parseMediaPlaylist = (playlist: string, baseUrl: string) => {
  const segments: Segment[] = [];
  let sequence = 0;
  let key: Key | undefined;
  for (const line of toLines(playlist)) {
    if (line.startsWith("#EXT-X-MEDIA-SEQUENCE:")) {
      sequence = Number(line.slice("#EXT-X-MEDIA-SEQUENCE:".length));
    } else if (line.startsWith("#EXT-X-KEY:")) {
      const attributes = parseAttributes(line);
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

const decrypt = async (
  data: Buffer,
  segment: Segment,
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
export const stripId3 = (data: Buffer) => {
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

const parseAttributes = (line: string) => {
  const attributes: Record<string, string> = {};
  for (const match of line.slice(line.indexOf(":") + 1).matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)) {
    const [, name, value] = match;
    if (name && value !== undefined) {
      attributes[name] = value.replace(/^"|"$/g, "");
    }
  }
  return attributes;
};

const toLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
