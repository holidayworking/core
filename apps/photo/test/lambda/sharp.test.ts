import { expectFailure, expectSuccess } from "@core/utils";
import sharp from "sharp";
import { expect, test } from "vite-plus/test";

import { toWatermarkedWebp, toWebp } from "../../lib/lambda/sharp.ts";
import { CAPTURED_EXIF, createPhoto } from "./fixtures.ts";

const PHOTO = { height: 900, width: 1600 };

const decode = async (webp: Uint8Array) => {
  const { data, info } = await sharp(webp).raw().toBuffer({ resolveWithObject: true });
  const rowLength = info.width * info.channels;
  const row = (y: number) => data.subarray(y * rowLength, (y + 1) * rowLength);
  // The band is the run of bright rows at the bottom; the photo itself is far darker.
  let bandTop = info.height;
  while (bandTop > 0 && row(bandTop - 1).reduce((total, v) => total + v, 0) / rowLength > 200) {
    bandTop -= 1;
  }
  // Text is drawn in dark gray on the band, so a dark pixel means something was printed.
  const isInked = (left: number, top: number, width: number, height: number) => {
    for (let y = top; y < top + height; y += 1) {
      for (let x = left; x < left + width; x += 1) {
        const offset = y * rowLength + x * info.channels;
        if (data[offset] < 200 && data[offset + 1] < 200 && data[offset + 2] < 200) {
          return true;
        }
      }
    }
    return false;
  };
  const isWhiteRow = (y: number) => row(y).every((value) => value >= 240);
  return { bandHeight: info.height - bandTop, bandTop, isInked, isWhiteRow };
};

const bandHeightOf = async (webp: Uint8Array) => (await decode(webp)).bandHeight;

test("toWebp converts the image to WebP", async () => {
  const photo = await createPhoto({ height: 2, width: 2 });

  const result = await toWebp(photo, 100);

  const webp = expectSuccess(result);
  const metadata = await sharp(webp).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(2);
});

test("toWebp resizes to the given width, keeping the aspect ratio, before converting to WebP", async () => {
  const photo = await createPhoto({ height: 100, width: 200 });

  const result = await toWebp(photo, 100);

  const webp = expectSuccess(result);
  const metadata = await sharp(webp).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(100);
  expect(metadata.height).toBe(50);
});

test("toWebp does not upscale an image smaller than the given width", async () => {
  const photo = await createPhoto({ height: 10, width: 20 });

  const result = await toWebp(photo, 100);

  const webp = expectSuccess(result);
  const metadata = await sharp(webp).metadata();
  expect(metadata.width).toBe(20);
  expect(metadata.height).toBe(10);
});

test("toWebp returns Failure when the input is not a valid image", async () => {
  const result = await toWebp(new Uint8Array([0, 1, 2, 3]), 100);

  expect(expectFailure(result)).toBeInstanceOf(Error);
});

test("toWatermarkedWebp draws a white band over the bottom of the photo", async () => {
  const photo = await createPhoto({ exif: CAPTURED_EXIF, ...PHOTO });

  const result = await toWatermarkedWebp(photo);

  const webp = expectSuccess(result);
  const metadata = await sharp(webp).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(PHOTO.width);
  expect(metadata.height).toBe(PHOTO.height);
  const { bandHeight, bandTop, isWhiteRow } = await decode(webp);
  expect(bandHeight).toBeGreaterThan(0);
  expect(isWhiteRow(bandTop)).toBe(true);
  expect(isWhiteRow(bandTop - 1)).toBe(false);
});

test("toWatermarkedWebp keeps the band to a single line when there are no exposure settings", async () => {
  const photo = await createPhoto({
    exif: {
      IFD2: { DateTimeOriginal: "2026:08:15 11:56:24" },
      IFD3: CAPTURED_EXIF.IFD3,
    },
    ...PHOTO,
  });
  const twoLinePhoto = await createPhoto({ exif: CAPTURED_EXIF, ...PHOTO });

  const webp = expectSuccess(await toWatermarkedWebp(photo));

  const bandHeight = await bandHeightOf(webp);
  const twoLineBandHeight = await bandHeightOf(
    expectSuccess(await toWatermarkedWebp(twoLinePhoto)),
  );
  expect(bandHeight).toBeGreaterThan(0);
  expect(bandHeight).toBeLessThan(twoLineBandHeight);
});

test("toWatermarkedWebp prints the camera over the capture time and the exposure settings over the coordinates", async () => {
  const photo = await createPhoto({ exif: CAPTURED_EXIF, ...PHOTO });

  const webp = expectSuccess(await toWatermarkedWebp(photo));

  const { bandHeight, bandTop, isInked } = await decode(webp);
  const half = Math.round(bandHeight / 2);
  const width = PHOTO.width / 2;
  expect(isInked(0, bandTop, width, half)).toBe(true);
  expect(isInked(width, bandTop, width, half)).toBe(true);
  expect(isInked(0, bandTop + half, width, bandHeight - half)).toBe(true);
  expect(isInked(width, bandTop + half, width, bandHeight - half)).toBe(true);
});

test("toWatermarkedWebp leaves the photo untouched when its EXIF has nothing to print", async () => {
  const photo = await createPhoto(PHOTO);

  const webp = expectSuccess(await toWatermarkedWebp(photo));

  const metadata = await sharp(webp).metadata();
  expect(metadata.width).toBe(PHOTO.width);
  expect(metadata.height).toBe(PHOTO.height);
});

test("toWatermarkedWebp leaves a photo too small for the band untouched", async () => {
  const photo = await createPhoto({ exif: CAPTURED_EXIF, height: 51, width: 51 });

  const webp = expectSuccess(await toWatermarkedWebp(photo));

  const metadata = await sharp(webp).metadata();
  expect(metadata.width).toBe(51);
  expect(metadata.height).toBe(51);
});

test("toWatermarkedWebp puts the band at the bottom of the photo as it is displayed, not as it is stored", async () => {
  const photo = await createPhoto({ exif: CAPTURED_EXIF, orientation: 6, ...PHOTO });

  const webp = expectSuccess(await toWatermarkedWebp(photo));

  const metadata = await sharp(webp).metadata();
  expect(metadata.width).toBe(PHOTO.height);
  expect(metadata.height).toBe(PHOTO.width);
  expect(await bandHeightOf(webp)).toBeGreaterThan(0);
});

test("toWatermarkedWebp returns Failure when the input is not a valid image", async () => {
  const result = await toWatermarkedWebp(new Uint8Array([0, 1, 2, 3]));

  expect(expectFailure(result)).toBeInstanceOf(Error);
});
