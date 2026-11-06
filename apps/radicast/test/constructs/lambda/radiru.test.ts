import { Success } from "@core/utils";
import { expectFailure, expectSuccess } from "@core/utils/test";
import { createCipheriv } from "crypto";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { Episode } from "../../../lib/constructs/lambda/episode.ts";
import { recordRadiruEpisode } from "../../../lib/constructs/lambda/radiru.ts";
import { removeParts, toEpisode } from "../../../lib/constructs/lambda/recording.ts";
import { createRadiruDefinition, createRadiruSeries } from "./fixtures.ts";

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  writeFileSync: vi.fn(),
}));

vi.mock("../../../lib/constructs/lambda/recording.ts", () => ({
  removeParts: vi.fn(),
  toEpisode: vi.fn(),
}));

const writeFileSyncMock = vi.mocked(writeFileSync);
const toEpisodeMock = vi.mocked(toEpisode);
const removePartsMock = vi.mocked(removeParts);
const fetchMock = vi.fn();

const seriesUrl =
  "https://www.nhk.or.jp/radio-api/app/v1/web/ondemand/series?site_id=88W859PYQ9&corner_site_id=01";

const streamUrl = (hour: number) =>
  `https://vod-stream.nhk.jp/radioondemand/r/88W859PYQ9/s/stream_${hour}/index.m3u8`;

const segmentUrl = (hour: number) => new URL("seg.aac", streamUrl(hour)).toString();

// Serves the series API and the streams. A URL not listed in responses gets a
// single-segment stream whose body is the segment URL; a null response is a 404.
const serve = ({
  series = createRadiruSeries(),
  responses = {},
}: {
  series?: ReturnType<typeof createRadiruSeries>;
  responses?: Record<string, string | Buffer | null>;
} = {}) =>
  fetchMock.mockImplementation(async (url: string) => {
    if (url === seriesUrl) {
      return Response.json(series);
    }
    const body = responses[url];
    if (body === null) {
      return new Response(null, { status: 404 });
    }
    if (body !== undefined) {
      return new Response(typeof body === "string" ? body : new Uint8Array(body));
    }
    return new Response(url.endsWith(".m3u8") ? "#EXTM3U\n#EXTINF:6.016,\nseg.aac\n" : url);
  });

const recordSchedule = (programSchedule = "05 20 * * 0") =>
  recordRadiruEpisode({ ...createRadiruDefinition(), programSchedules: [programSchedule] });

const base = streamUrl(20).replace("/index.m3u8", "");
const outputPath = `${tmpdir()}/20261101200500-88W859PYQ9.aac`;
const key = Buffer.from("00112233445566778899aabbccddeeff", "hex");

// An ID3v2 tag with a 4-byte payload, as found at the start of packed audio segments
const id3 = Buffer.concat([
  Buffer.from("ID3"),
  Buffer.from([0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04]),
  Buffer.from("PRIV"),
]);

const encrypt = (data: Buffer, iv: number) => {
  const cipher = createCipheriv(
    "aes-128-cbc",
    key,
    Buffer.from(iv.toString(16).padStart(32, "0"), "hex"),
  );
  return Buffer.concat([cipher.update(data), cipher.final()]);
};

// Records only the 20:05 episode from the given master playlist.
const recordStream = (playlist: string, responses: Record<string, string | Buffer | null> = {}) => {
  serve({ responses: { [streamUrl(20)]: playlist, ...responses } });
  return recordSchedule();
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  // Fixed at JST 2026-11-01 (Sun) 23:30, the execution schedule
  vi.setSystemTime(new Date("2026-11-01T14:30:00Z"));
  vi.stubGlobal("fetch", fetchMock);
  serve();
  toEpisodeMock.mockImplementation(
    async (parts, { startedAt }) =>
      new Success(
        Episode.from({
          startedAt,
          size: 12_345,
          localPath: parts[0]?.path.replace(/\.aac$/, ".m4a"),
        }),
      ),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("skips episodes whose start time cannot be parsed", async () => {
  const series = createRadiruSeries();
  series.episodes[0]!.aa_contents_id = "invalid";
  serve({ series });

  const result = await recordSchedule();

  expect(expectFailure(result).message).toBe(
    "episode starting at 2026-11-01 20:05 is not available",
  );
});

test("keeps the program title when it does not start with the series title", async () => {
  const series = createRadiruSeries();
  series.title = "別の番組";
  serve({ series });

  await recordSchedule();

  expect(toEpisodeMock.mock.calls[0]?.[0][0]?.title).toBe(
    "らじらー! サンデー 20時台 川﨑桜 柴田柚菜(乃木坂46)",
  );
});

test("matches the closest episode within five minutes of the start time", async () => {
  const series = createRadiruSeries();
  series.episodes = (
    [
      [1, "20:05:03"],
      [2, "20:09:00"],
      [3, "20:11:00"],
    ] as const
  ).map(([stream, startedAt]) => ({
    ...series.episodes[0]!,
    stream_url: streamUrl(stream),
    aa_contents_id: `[radio]vod;title;r1,130;1;2026-11-01T${startedAt}+09:00_2026-11-01T20:55:00+09:00`,
  }));
  serve({ series });

  await recordSchedule("05 20 * * 0");

  expect(writeFileSyncMock).toHaveBeenLastCalledWith(
    `${tmpdir()}/20261101200503-88W859PYQ9.aac`,
    Buffer.from(segmentUrl(1)),
  );

  await recordSchedule("15 20 * * 0");

  expect(writeFileSyncMock).toHaveBeenLastCalledWith(
    `${tmpdir()}/20261101201100-88W859PYQ9.aac`,
    Buffer.from(segmentUrl(3)),
  );

  const result = await recordSchedule("55 19 * * 0");

  expect(expectFailure(result).message).toBe(
    "episode starting at 2026-11-01 19:55 is not available",
  );
});

test("records the episodes matching the program schedules and concatenates them", async () => {
  const result = await recordRadiruEpisode(createRadiruDefinition());

  expect(fetchMock).toHaveBeenCalledWith(seriesUrl);
  const firstPath = `${tmpdir()}/20261101200500-88W859PYQ9.aac`;
  const secondPath = `${tmpdir()}/20261101210500-88W859PYQ9.aac`;
  expect(writeFileSyncMock).toHaveBeenCalledTimes(2);
  expect(writeFileSyncMock).toHaveBeenCalledWith(firstPath, Buffer.from(segmentUrl(20)));
  expect(writeFileSyncMock).toHaveBeenCalledWith(secondPath, Buffer.from(segmentUrl(21)));
  expect(toEpisodeMock).toHaveBeenCalledWith(
    [
      { path: firstPath, title: "20時台 川﨑桜 柴田柚菜(乃木坂46)" },
      { path: secondPath, title: "21時台 川﨑桜 柴田柚菜 弓木奈於(乃木坂46)" },
    ],
    { startedAt: new Date("2026-11-01T20:05:00+09:00") },
  );

  const episode = expectSuccess(result);
  expect(episode.startedAt.getTime()).toBe(Date.parse("2026-11-01T20:05:00+09:00"));
  expect(episode.size).toBe(12_345);
  expect(episode.localPath).toBe(`${tmpdir()}/20261101200500-88W859PYQ9.m4a`);
});

test("returns Failure without recording when an episode is not available yet", async () => {
  const definition = createRadiruDefinition();
  definition.programSchedules = ["05 20 * * 0", "05 23 * * 0"];
  // Fixed at JST 2026-11-02 (Mon) 00:00, after the 23:05 schedule
  vi.setSystemTime(new Date("2026-11-01T15:00:00Z"));

  const result = await recordRadiruEpisode(definition);

  expect(expectFailure(result).message).toBe(
    "episode starting at 2026-11-01 23:05 is not available",
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(writeFileSyncMock).not.toHaveBeenCalled();
});

test("returns Failure when the series API fails", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

  const result = await recordRadiruEpisode(createRadiruDefinition());

  expect(expectFailure(result).message).toBe(`failed to fetch ${seriesUrl}: 500`);
});

test("returns Failure and removes the parts when a download fails", async () => {
  serve({ responses: { [streamUrl(21)]: null } });

  const result = await recordRadiruEpisode(createRadiruDefinition());

  expect(expectFailure(result).message).toBe(`failed to fetch ${streamUrl(21)}: 404`);
  // Both downloads are awaited before the parts are removed
  expect(writeFileSyncMock).toHaveBeenCalledExactlyOnceWith(
    `${tmpdir()}/20261101200500-88W859PYQ9.aac`,
    Buffer.from(segmentUrl(20)),
  );
  expect(writeFileSyncMock.mock.invocationCallOrder[0]).toBeLessThan(
    removePartsMock.mock.invocationCallOrder[0]!,
  );
  expect(removePartsMock).toHaveBeenCalledWith([
    {
      path: `${tmpdir()}/20261101200500-88W859PYQ9.aac`,
      title: "20時台 川﨑桜 柴田柚菜(乃木坂46)",
    },
    {
      path: `${tmpdir()}/20261101210500-88W859PYQ9.aac`,
      title: "21時台 川﨑桜 柴田柚菜 弓木奈於(乃木坂46)",
    },
  ]);
  expect(toEpisodeMock).not.toHaveBeenCalled();
});

test("resolves segment URLs and applies the key given by the playlist", async () => {
  const result = await recordStream(
    [
      "#EXTM3U",
      "#EXT-X-MEDIA-SEQUENCE:5",
      '#EXT-X-KEY:METHOD=AES-128,URI="serve.key?s=1",IV=0x0000000000000000000000000000000a',
      "#EXTINF:6.016,",
      "seg_1.aac?s=1",
      "#EXT-X-KEY:METHOD=NONE",
      "#EXTINF:6.016,",
      "https://cdn.example.com/seg_2.aac",
      "#EXT-X-ENDLIST",
    ].join("\n"),
    {
      [`${base}/serve.key?s=1`]: key,
      [`${base}/seg_1.aac?s=1`]: encrypt(Buffer.from("first"), 0x0a),
      "https://cdn.example.com/seg_2.aac": Buffer.from("second"),
    },
  );

  expect(result.isSuccess()).toBe(true);
  expect(writeFileSyncMock).toHaveBeenCalledExactlyOnceWith(outputPath, Buffer.from("firstsecond"));
});

test("removes leading ID3 tags from the segments", async () => {
  const adts = Buffer.from([0xff, 0xf1, 0x58, 0x80]);

  const result = await recordStream(
    ["#EXTM3U", "#EXTINF:6.016,", "seg_1.aac", "#EXTINF:6.016,", "seg_2.aac"].join("\n"),
    {
      [`${base}/seg_1.aac`]: Buffer.concat([id3, id3, adts]),
      [`${base}/seg_2.aac`]: adts,
    },
  );

  expect(result.isSuccess()).toBe(true);
  expect(writeFileSyncMock).toHaveBeenCalledExactlyOnceWith(
    outputPath,
    Buffer.concat([adts, adts]),
  );
});

test("picks the highest bandwidth variant and decrypts every segment", async () => {
  const result = await recordStream(
    [
      "#EXTM3U",
      '#EXT-X-STREAM-INF:BANDWIDTH=24000,CODECS="mp4a.40.5"',
      "index_24k.m3u8",
      '#EXT-X-STREAM-INF:BANDWIDTH=48000,CODECS="mp4a.40.5"',
      "index_48k.m3u8",
    ].join("\n"),
    {
      [`${base}/index_48k.m3u8`]: [
        "#EXTM3U",
        "#EXT-X-MEDIA-SEQUENCE:1",
        '#EXT-X-KEY:METHOD=AES-128,URI="serve.key"',
        "#EXTINF:6.016,",
        "seg_1.aac",
        "#EXTINF:6.016,",
        "seg_2.aac",
        "#EXT-X-ENDLIST",
      ].join("\n"),
      [`${base}/serve.key`]: key,
      [`${base}/seg_1.aac`]: encrypt(Buffer.concat([id3, Buffer.from("first")]), 1),
      [`${base}/seg_2.aac`]: encrypt(Buffer.concat([id3, Buffer.from("second")]), 2),
    },
  );

  expect(result.isSuccess()).toBe(true);
  expect(writeFileSyncMock).toHaveBeenCalledWith(outputPath, Buffer.from("firstsecond"));
  // The key is fetched only once
  expect(fetchMock.mock.calls.filter(([url]) => url === `${base}/serve.key`)).toHaveLength(1);
});

test("returns Failure when a segment cannot be fetched", async () => {
  const result = await recordStream(["#EXTM3U", "#EXTINF:6.016,", "seg_1.aac"].join("\n"), {
    [`${base}/seg_1.aac`]: null,
  });

  expect(expectFailure(result).message).toBe(`failed to fetch ${base}/seg_1.aac: 404`);
  expect(writeFileSyncMock).not.toHaveBeenCalled();
});

test("returns Failure for an unsupported encryption method", async () => {
  const result = await recordStream(
    ["#EXTM3U", '#EXT-X-KEY:METHOD=SAMPLE-AES,URI="serve.key"', "#EXTINF:6.016,", "seg_1.aac"].join(
      "\n",
    ),
    { [`${base}/seg_1.aac`]: Buffer.from("data") },
  );

  expect(expectFailure(result).message).toBe("unsupported encryption method: SAMPLE-AES");
});

test("returns Failure when the playlist has no segments", async () => {
  const result = await recordStream("#EXTM3U\n#EXT-X-ENDLIST\n");

  expect(expectFailure(result).message).toBe(`no segments found in ${streamUrl(20)}`);
});
