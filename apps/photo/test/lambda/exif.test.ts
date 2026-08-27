import { expect, test } from "vitest";

import { readWatermark } from "../../lib/lambda/exif.ts";
import { createExif } from "./fixtures.ts";

test("readWatermark formats the capture time, the exposure settings and the coordinates", async () => {
  const exif = await createExif({
    IFD2: {
      DateTimeOriginal: "2026:08:15 11:56:24",
      ExposureTime: "1/100",
      FNumber: "163/100",
      FocalLength: "87/10",
      FocalLengthIn35mmFilm: "23",
      ISOSpeedRatings: "80",
    },
    IFD3: {
      GPSLatitude: "35/1 27/1 50/1",
      GPSLatitudeRef: "N",
      GPSLongitude: "139/1 37/1 12/1",
      GPSLongitudeRef: "E",
    },
  });

  expect(readWatermark(exif)).toStrictEqual({
    dateTime: "2026.08.15 11:56",
    exposure: "23mm f/1.63 1/100s ISO80",
    location: `35°27'50"N 139°37'12"E`,
  });
});

test("readWatermark falls back to the actual focal length when there is no 35 mm equivalent", async () => {
  const exif = await createExif({ IFD2: { FNumber: "28/10", FocalLength: "87/10" } });

  expect(readWatermark(exif).exposure).toBe("8.7mm f/2.8");
});

test("readWatermark writes an exposure of a second or longer in seconds", async () => {
  const exif = await createExif({ IFD2: { ExposureTime: "5/2", ISOSpeedRatings: "100" } });

  expect(readWatermark(exif).exposure).toBe("2.5s ISO100");
});

test("readWatermark carries a fractional part in the minutes down to the seconds", async () => {
  const exif = await createExif({
    IFD3: {
      GPSLatitude: "35/1 2784/100 0/1",
      GPSLatitudeRef: "N",
      GPSLongitude: "139/1 372/10 0/1",
      GPSLongitudeRef: "E",
    },
  });

  expect(readWatermark(exif).location).toBe(`35°27'50"N 139°37'12"E`);
});

test("readWatermark keeps the hemisphere of the coordinates", async () => {
  const exif = await createExif({
    IFD3: {
      GPSLatitude: "33/1 51/1 31/1",
      GPSLatitudeRef: "S",
      GPSLongitude: "151/1 12/1 34/1",
      GPSLongitudeRef: "W",
    },
  });

  expect(readWatermark(exif).location).toBe(`33°51'31"S 151°12'34"W`);
});

test("readWatermark returns nothing when the image has no EXIF", () => {
  expect(readWatermark(undefined)).toStrictEqual({});
});

test("readWatermark returns nothing when the EXIF has nothing to print", async () => {
  const exif = await createExif({ IFD0: { Make: "Xiaomi" } });

  expect(readWatermark(exif)).toStrictEqual({
    dateTime: undefined,
    exposure: undefined,
    location: undefined,
  });
});

test("readWatermark returns nothing when the EXIF cannot be parsed", () => {
  expect(readWatermark(Buffer.from([0, 1, 2, 3]))).toStrictEqual({});
});
