import { createCipheriv } from "crypto";
import { writeFileSync } from "fs";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { downloadHls, parseMediaPlaylist, stripId3 } from "../../../lib/constructs/lambda/hls.ts";

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  writeFileSync: vi.fn(),
}));

const writeFileSyncMock = vi.mocked(writeFileSync);

const base = "https://example.com/stream";
const key = Buffer.from("00112233445566778899aabbccddeeff", "hex");

// An ID3v2 tag with a 4-byte payload, as found at the start of packed audio segments
const id3 = Buffer.concat([
  Buffer.from("ID3"),
  Buffer.from([0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04]),
  Buffer.from("PRIV"),
]);

const encrypt = (data: Buffer, sequence: number) => {
  const iv = Buffer.from(sequence.toString(16).padStart(32, "0"), "hex");
  const cipher = createCipheriv("aes-128-cbc", key, iv);
  return Buffer.concat([cipher.update(data), cipher.final()]);
};

const stubFetch = (responses: Record<string, string | Buffer>) => {
  const fetchMock = vi.fn(async (url: string) => {
    const body = responses[url];
    if (body === undefined) {
      return new Response(null, { status: 404 });
    }
    return new Response(typeof body === "string" ? body : new Uint8Array(body));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("parseMediaPlaylist resolves segments with their sequence numbers and keys", () => {
  const playlist = [
    "#EXTM3U",
    "#EXT-X-MEDIA-SEQUENCE:5",
    '#EXT-X-KEY:METHOD=AES-128,URI="serve.key?s=1",IV=0x0000000000000000000000000000000a',
    "#EXTINF:6.016,",
    "seg_1.aac?s=1",
    "#EXT-X-KEY:METHOD=NONE",
    "#EXTINF:6.016,",
    "https://cdn.example.com/seg_2.aac",
    "#EXT-X-ENDLIST",
  ].join("\n");

  expect(parseMediaPlaylist(playlist, `${base}/index_48k.m3u8?s=1`)).toEqual([
    {
      url: `${base}/seg_1.aac?s=1`,
      sequence: 5,
      key: {
        method: "AES-128",
        uri: `${base}/serve.key?s=1`,
        iv: "0x0000000000000000000000000000000a",
      },
    },
    {
      url: "https://cdn.example.com/seg_2.aac",
      sequence: 6,
      key: { method: "NONE", uri: undefined, iv: undefined },
    },
  ]);
});

test("stripId3 removes leading ID3 tags", () => {
  const adts = Buffer.from([0xff, 0xf1, 0x58, 0x80]);

  expect(stripId3(Buffer.concat([id3, id3, adts]))).toEqual(adts);
  expect(stripId3(adts)).toEqual(adts);
});

test("downloadHls picks the highest bandwidth variant and decrypts every segment", async () => {
  const fetchMock = stubFetch({
    [`${base}/index.m3u8`]: [
      "#EXTM3U",
      '#EXT-X-STREAM-INF:BANDWIDTH=24000,CODECS="mp4a.40.5"',
      "index_24k.m3u8",
      '#EXT-X-STREAM-INF:BANDWIDTH=48000,CODECS="mp4a.40.5"',
      "index_48k.m3u8",
    ].join("\n"),
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
  });

  await downloadHls(`${base}/index.m3u8`, "/tmp/out.aac");

  expect(writeFileSyncMock).toHaveBeenCalledWith(
    "/tmp/out.aac",
    Buffer.concat([Buffer.from("first"), Buffer.from("second")]),
  );
  // The key is fetched only once
  expect(fetchMock.mock.calls.filter(([url]) => url === `${base}/serve.key`)).toHaveLength(1);
});

test("downloadHls fails when a segment cannot be fetched", async () => {
  stubFetch({
    [`${base}/index.m3u8`]: ["#EXTM3U", "#EXTINF:6.016,", "seg_1.aac"].join("\n"),
  });

  await expect(downloadHls(`${base}/index.m3u8`, "/tmp/out.aac")).rejects.toThrow(
    `failed to fetch ${base}/seg_1.aac: 404`,
  );
  expect(writeFileSyncMock).not.toHaveBeenCalled();
});

test("downloadHls fails for an unsupported encryption method", async () => {
  stubFetch({
    [`${base}/index.m3u8`]: [
      "#EXTM3U",
      '#EXT-X-KEY:METHOD=SAMPLE-AES,URI="serve.key"',
      "#EXTINF:6.016,",
      "seg_1.aac",
    ].join("\n"),
    [`${base}/seg_1.aac`]: Buffer.from("data"),
  });

  await expect(downloadHls(`${base}/index.m3u8`, "/tmp/out.aac")).rejects.toThrow(
    "unsupported encryption method: SAMPLE-AES",
  );
});

test("downloadHls fails when the playlist has no segments", async () => {
  stubFetch({ [`${base}/index.m3u8`]: "#EXTM3U\n#EXT-X-ENDLIST\n" });

  await expect(downloadHls(`${base}/index.m3u8`, "/tmp/out.aac")).rejects.toThrow(
    `no segments found in ${base}/index.m3u8`,
  );
});
