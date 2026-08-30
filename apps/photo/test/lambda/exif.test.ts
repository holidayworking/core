import { Logger } from "@aws-lambda-powertools/logger";
import { expect, test, vi } from "vite-plus/test";

import { readWatermark } from "../../lib/lambda/exif.ts";
import { CAPTURED_EXIF, createExif } from "./fixtures.ts";

const warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {});

test("readWatermark formats the camera, the capture time, the exposure settings and the coordinates", async () => {
  // Both focal lengths are set: the 35mm equivalent is the one that has to be printed.
  const exif = await createExif({
    ...CAPTURED_EXIF,
    IFD2: { ...CAPTURED_EXIF.IFD2, FocalLength: "87/10" },
  });

  expect(readWatermark(exif)).toStrictEqual({
    dateTime: "2026.08.15 11:56",
    device: "15 Ultra",
    exposure: "23mm f/1.63 1/100s ISO80",
    location: `35°27'50"N 139°37'12"E`,
  });
});

test("readWatermark returns nothing when the image has no EXIF", () => {
  expect(readWatermark(undefined)).toStrictEqual({});
});

test("readWatermark returns nothing when the EXIF has nothing to print", async () => {
  const exif = await createExif({ IFD0: { ImageDescription: "a photo" } });

  expect(readWatermark(exif)).toStrictEqual({
    dateTime: undefined,
    device: undefined,
    exposure: undefined,
    location: undefined,
  });
});

test("readWatermark returns nothing and logs when the EXIF cannot be parsed", () => {
  expect(readWatermark(Buffer.from([0, 1, 2, 3]))).toStrictEqual({});
  expect(warnSpy).toHaveBeenCalledExactlyOnceWith("could not read EXIF", {
    error: expect.any(Error),
    field: "exif",
  });
});
