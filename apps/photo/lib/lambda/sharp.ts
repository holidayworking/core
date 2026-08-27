import type { Sharp } from "sharp";

import { Success, toFailure } from "@core/utils";
import sharp from "sharp";

import { readWatermark } from "./exif.ts";
import { withWatermark } from "./watermark.ts";

// `os.cpus()` reports the host's core count, not the fraction of CPU this
// invocation is actually allocated, so sharp's default (one thread per core)
// over-provisions for a single-image conversion.
sharp.concurrency(1);

// A warm execution environment can be reused across unrelated requests, so
// caching a previous invocation's decoded image only wastes memory here.
sharp.cache(false);

const decode = (image: Uint8Array) => sharp(image, { autoOrient: true });
const encode = (pipeline: Sharp) => pipeline.webp().toBuffer();

export const toWebp = async (image: Uint8Array, width: number) => {
  try {
    return new Success(await encode(decode(image).resize({ width, withoutEnlargement: true })));
  } catch (e) {
    return toFailure(e);
  }
};

export const toWatermarkedWebp = async (image: Uint8Array) => {
  try {
    const pipeline = decode(image);
    // `metadata().width`/`height` ignore the EXIF orientation, while
    // `autoOrient` holds the dimensions the decoded pipeline actually has,
    // which is what the watermark band must be laid out against.
    const { autoOrient, exif } = await pipeline.metadata();
    return new Success(
      await encode(await withWatermark(pipeline, readWatermark(exif), autoOrient)),
    );
  } catch (e) {
    return toFailure(e);
  }
};
