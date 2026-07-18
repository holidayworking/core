import { afterEach, expect, test, vi } from "vitest";

import { Episode } from "../../../lib/constructs/lambda/episode.ts";

afterEach(() => {
  vi.useRealTimers();
});

test("derives startedAt from the url filename as JST", () => {
  const episode = Episode.from({
    url: "https://example.com/yuna78mhz/20260714230000.m4a",
    size: 123,
  });

  expect(episode.startedAt.getTime()).toBe(Date.parse("2026-07-14T23:00:00+09:00"));
  expect(episode.url).toBe("https://example.com/yuna78mhz/20260714230000.m4a");
  expect(episode.size).toBe(123);
});

test("prefers an explicit startedAt over the url filename", () => {
  const startedAt = new Date("2026-01-01T00:00:00Z");

  const episode = Episode.from({
    url: "https://example.com/yuna78mhz/20260714230000.m4a",
    startedAt,
  });

  expect(episode.startedAt).toBe(startedAt);
});

test("falls back to the current time without url and startedAt", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-18T12:34:56Z"));

  const episode = Episode.from({});

  expect(episode.startedAt.getTime()).toBe(Date.parse("2026-07-18T12:34:56Z"));
});

test("keeps station, size and localPath as passed", () => {
  const episode = Episode.from({
    station: "BAYFM78",
    startedAt: new Date("2026-07-14T14:00:00Z"),
    size: 456,
    localPath: "/tmp/20260714230000-BAYFM78.m4a",
  });

  expect(episode.station).toBe("BAYFM78");
  expect(episode.size).toBe(456);
  expect(episode.localPath).toBe("/tmp/20260714230000-BAYFM78.m4a");
});
