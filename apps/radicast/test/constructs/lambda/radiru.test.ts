import { Success } from "@core/utils";
import { expectFailure, expectSuccess } from "@core/utils/test";
import { tmpdir } from "os";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { Episode } from "../../../lib/constructs/lambda/episode.ts";
import { downloadHls } from "../../../lib/constructs/lambda/hls.ts";
import { removeParts, toEpisode } from "../../../lib/constructs/lambda/media.ts";
import {
  findEpisode,
  parseSeries,
  recordRadiruEpisode,
  seriesUrl,
} from "../../../lib/constructs/lambda/radiru.ts";
import { createRadiruDefinition, createRadiruSeries } from "./fixtures.ts";

vi.mock("../../../lib/constructs/lambda/hls.ts", () => ({
  downloadHls: vi.fn(),
}));

vi.mock("../../../lib/constructs/lambda/media.ts", () => ({
  removeParts: vi.fn(),
  toEpisode: vi.fn(),
}));

const downloadHlsMock = vi.mocked(downloadHls);
const toEpisodeMock = vi.mocked(toEpisode);
const removePartsMock = vi.mocked(removeParts);
const fetchMock = vi.fn();

const streamUrl = (hour: number) =>
  `https://vod-stream.nhk.jp/radioondemand/r/88W859PYQ9/s/stream_${hour}/index.m3u8`;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  // Fixed at JST 2026-11-01 (Sun) 23:30, the execution schedule
  vi.setSystemTime(new Date("2026-11-01T14:30:00Z"));
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(Response.json(createRadiruSeries()));
  downloadHlsMock.mockResolvedValue();
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

test("seriesUrl builds the on-demand series API URL", () => {
  expect(seriesUrl(createRadiruDefinition())).toBe(
    "https://www.nhk.or.jp/radio-api/app/v1/web/ondemand/series?site_id=88W859PYQ9&corner_site_id=01",
  );
});

test("parseSeries extracts the start time and strips the series title", () => {
  const series = createRadiruSeries();
  series.episodes.push({ ...series.episodes[0]!, aa_contents_id: "invalid" });

  expect(parseSeries(series)).toEqual([
    {
      title: "20時台 川﨑桜 柴田柚菜(乃木坂46)",
      streamUrl: streamUrl(20),
      startedAt: new Date("2026-11-01T20:05:00+09:00"),
    },
    {
      title: "21時台 川﨑桜 柴田柚菜 弓木奈於(乃木坂46)",
      streamUrl: streamUrl(21),
      startedAt: new Date("2026-11-01T21:05:00+09:00"),
    },
    {
      title: "22時台 川﨑桜 弓木奈於(乃木坂46)",
      streamUrl: streamUrl(22),
      startedAt: new Date("2026-11-01T22:05:00+09:00"),
    },
  ]);
});

test("parseSeries keeps the program title when it does not start with the series title", () => {
  const series = createRadiruSeries();
  series.title = "別の番組";

  expect(parseSeries(series)[0]?.title).toBe("らじらー! サンデー 20時台 川﨑桜 柴田柚菜(乃木坂46)");
});

test("findEpisode matches the closest episode within five minutes of the start time", () => {
  const episode = (startedAt: string) => ({
    title: startedAt,
    streamUrl: "",
    startedAt: new Date(startedAt),
  });
  const episodes = [
    episode("2026-10-30T11:00:03+09:00"),
    episode("2026-10-30T11:04:00+09:00"),
    episode("2026-10-30T11:06:00+09:00"),
  ];

  expect(findEpisode(episodes, new Date("2026-10-30T11:00:00+09:00"))?.title).toBe(
    "2026-10-30T11:00:03+09:00",
  );
  expect(findEpisode(episodes, new Date("2026-10-30T11:10:00+09:00"))?.title).toBe(
    "2026-10-30T11:06:00+09:00",
  );
  expect(findEpisode(episodes, new Date("2026-10-30T10:50:00+09:00"))).toBeUndefined();
});

test("records the episodes matching the program schedules and concatenates them", async () => {
  const result = await recordRadiruEpisode(createRadiruDefinition());

  expect(fetchMock).toHaveBeenCalledWith(seriesUrl(createRadiruDefinition()));
  const firstPath = `${tmpdir()}/20261101200500-88W859PYQ9.aac`;
  const secondPath = `${tmpdir()}/20261101210500-88W859PYQ9.aac`;
  expect(downloadHlsMock).toHaveBeenCalledTimes(2);
  expect(downloadHlsMock).toHaveBeenCalledWith(streamUrl(20), firstPath);
  expect(downloadHlsMock).toHaveBeenCalledWith(streamUrl(21), secondPath);
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
  expect(downloadHlsMock).not.toHaveBeenCalled();
});

test("returns Failure when the series API fails", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

  const result = await recordRadiruEpisode(createRadiruDefinition());

  expect(expectFailure(result).message).toBe(
    `failed to fetch ${seriesUrl(createRadiruDefinition())}: 500`,
  );
});

test("returns Failure and removes the parts when a download fails", async () => {
  downloadHlsMock.mockResolvedValueOnce().mockRejectedValueOnce(new Error("download failed"));

  const result = await recordRadiruEpisode(createRadiruDefinition());

  expect(expectFailure(result).message).toBe("download failed");
  // Both downloads are awaited before the parts are removed
  expect(downloadHlsMock).toHaveBeenCalledTimes(2);
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
