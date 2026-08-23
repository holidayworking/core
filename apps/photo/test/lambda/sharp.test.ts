import { expectFailure, expectSuccess } from "@core/utils";
import sharp from "sharp";
import { expect, test } from "vitest";

import { toWebp } from "../../lib/lambda/sharp.ts";

test("toWebp converts the image to WebP", async () => {
  const png = await sharp({
    create: { background: { b: 0, g: 0, r: 255 }, channels: 3, height: 2, width: 2 },
  })
    .png()
    .toBuffer();

  const result = await toWebp(png);

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
  const result = await toWebp(new Uint8Array([0, 1, 2, 3]));

  expect(expectFailure(result)).toBeInstanceOf(Error);
});
