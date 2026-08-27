import type { Exif } from "sharp";

import { expectFailure, expectSuccess } from "@core/utils";
import { createRequire } from "module";
import sharp from "sharp";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { toWatermarkedWebp, toWebp } from "../../lib/lambda/sharp.ts";
import { createPhoto } from "./fixtures.ts";

const require = createRequire(import.meta.url);
const fontFile = require.resolve("dejavu-fonts-ttf/ttf/DejaVuSans.ttf");
const boldFontFile = require.resolve("dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf");

const CAPTURED_EXIF: Exif = {
  IFD2: {
    DateTimeOriginal: "2026:08:15 11:56:24",
    ExposureTime: "1/100",
    FNumber: "163/100",
    FocalLengthIn35mmFilm: "23",
    ISOSpeedRatings: "80",
  },
  IFD3: {
    GPSLatitude: "35/1 27/1 50/1",
    GPSLatitudeRef: "N",
    GPSLongitude: "139/1 37/1 12/1",
    GPSLongitudeRef: "E",
  },
};

beforeEach(() => {
  vi.stubEnv("WATERMARK_FONT_FILE", fontFile);
  vi.stubEnv("WATERMARK_BOLD_FONT_FILE", boldFontFile);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("toWebp converts the image to WebP", async () => {
  const png = await sharp({
    create: { background: { b: 0, g: 0, r: 255 }, channels: 3, height: 2, width: 2 },
  })
    .png()
    .toBuffer();

  const result = await toWebp(png, 100);

  const webp = expectSuccess(result);
  const metadata = await sharp(webp).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(2);
});

test("toWebp resizes to the given width, keeping the aspect ratio, before converting to WebP", async () => {
  const png = await sharp({
    create: { background: { b: 0, g: 0, r: 255 }, channels: 3, height: 100, width: 200 },
  })
    .png()
    .toBuffer();

  const result = await toWebp(png, 100);

  const webp = expectSuccess(result);
  const metadata = await sharp(webp).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(100);
  expect(metadata.height).toBe(50);
});

test("toWebp does not upscale an image smaller than the given width", async () => {
  const png = await sharp({
    create: { background: { b: 0, g: 0, r: 255 }, channels: 3, height: 10, width: 20 },
  })
    .png()
    .toBuffer();

  const result = await toWebp(png, 100);

  const webp = expectSuccess(result);
  const metadata = await sharp(webp).metadata();
  expect(metadata.width).toBe(20);
  expect(metadata.height).toBe(10);
});

test("toWebp returns Failure when the input is not a valid image", async () => {
  const result = await toWebp(new Uint8Array([0, 1, 2, 3]), 100);

  expect(expectFailure(result)).toBeInstanceOf(Error);
});

const BAND_HEIGHT = 124;

test("toWatermarkedWebp adds a white band below the photo", async () => {
  const photo = await createPhoto({ exif: CAPTURED_EXIF, height: 900, width: 1600 });

  const result = await toWatermarkedWebp(photo);

  const webp = expectSuccess(result);
  const metadata = await sharp(webp).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(1600);
  expect(metadata.height).toBe(900 + BAND_HEIGHT);
  const band = await sharp(webp)
    .extract({ height: BAND_HEIGHT, left: 0, top: 900, width: 1600 })
    .stats();
  expect(band.channels.map(({ max }) => max)).toStrictEqual([255, 255, 255]);
});

test("toWatermarkedWebp keeps the band to a single line when there are no exposure settings", async () => {
  const photo = await createPhoto({
    exif: {
      IFD2: { DateTimeOriginal: "2026:08:15 11:56:24" },
      IFD3: CAPTURED_EXIF.IFD3,
    },
    height: 900,
    width: 1600,
  });

  const webp = expectSuccess(await toWatermarkedWebp(photo));

  const metadata = await sharp(webp).metadata();
  expect(metadata.height).toBe(900 + 79);
});

test("toWatermarkedWebp prints the capture time on the left and stacks the exposure settings over the coordinates on the right", async () => {
  const photo = await createPhoto({ exif: CAPTURED_EXIF, height: 900, width: 1600 });

  const webp = expectSuccess(await toWatermarkedWebp(photo));

  const isInked = async (left: number, top: number, height: number) => {
    const region = await sharp(webp).extract({ height, left, top, width: 800 }).grayscale().stats();
    return region.channels[0].min < 200;
  };
  const half = Math.round(BAND_HEIGHT / 2);
  expect(await isInked(0, 900, BAND_HEIGHT)).toBe(true);
  expect(await isInked(800, 900, half)).toBe(true);
  expect(await isInked(800, 900 + half, BAND_HEIGHT - half)).toBe(true);
});

test("toWatermarkedWebp leaves the photo untouched when its EXIF has nothing to print", async () => {
  const photo = await createPhoto({ height: 900, width: 1600 });

  const webp = expectSuccess(await toWatermarkedWebp(photo));

  const metadata = await sharp(webp).metadata();
  expect(metadata.width).toBe(1600);
  expect(metadata.height).toBe(900);
});

test("toWatermarkedWebp puts the band below the photo as it is displayed, not as it is stored", async () => {
  const photo = await createPhoto({
    exif: CAPTURED_EXIF,
    height: 900,
    orientation: 6,
    width: 1600,
  });

  const webp = expectSuccess(await toWatermarkedWebp(photo));

  const metadata = await sharp(webp).metadata();
  expect(metadata.width).toBe(900);
  expect(metadata.height).toBe(1600 + BAND_HEIGHT);
});

test("toWatermarkedWebp returns Failure when the input is not a valid image", async () => {
  const result = await toWatermarkedWebp(new Uint8Array([0, 1, 2, 3]));

  expect(expectFailure(result)).toBeInstanceOf(Error);
});
