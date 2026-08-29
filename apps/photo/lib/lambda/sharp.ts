import { Success, toFailure } from "@core/utils";
import sharp from "sharp";

import { readWatermark } from "./exif.ts";
import { toWatermarkOverlays } from "./watermark.ts";

// One invocation converts one image: extra worker threads only contend for the same vCPU,
// and the cache would hold pixels that no later invocation reuses.
sharp.concurrency(1);

sharp.cache(false);

const decode = (image: Uint8Array) => sharp(image, { autoOrient: true });

const toResult = async (render: () => Promise<Buffer>) => {
  try {
    return new Success(await render());
  } catch (e) {
    return toFailure(e);
  }
};

export const toWebp = (image: Uint8Array, width: number) =>
  toResult(() => decode(image).resize({ width, withoutEnlargement: true }).webp().toBuffer());

export const toWatermarkedWebp = (image: Uint8Array) =>
  toResult(async () => {
    const pipeline = decode(image);
    // `autoOrient` is the size the photo is displayed at, so the band lands at the bottom of
    // the photo as it is seen rather than as it is stored.
    const { autoOrient, exif } = await pipeline.metadata();
    const overlays = await toWatermarkOverlays(readWatermark(exif), autoOrient);
    return await (overlays.length > 0 ? pipeline.composite(overlays) : pipeline).webp().toBuffer();
  });
