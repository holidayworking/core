import { Success, toFailure } from "@core/utils";
import sharp from "sharp";

// `os.cpus()` reports the host's core count, not the fraction of CPU this
// invocation is actually allocated, so sharp's default (one thread per core)
// over-provisions for a single-image conversion.
sharp.concurrency(1);

// A warm execution environment can be reused across unrelated requests, so
// caching a previous invocation's decoded image only wastes memory here.
sharp.cache(false);

// Converts the image to WebP, optionally resizing it first. Matches Hugo's
// `$resource.Resize "600x"`: scale to the given width, keep the aspect
// ratio, and never upscale an image smaller than the target.
export const toWebp = async (image: Uint8Array, width?: number) => {
  try {
    let pipeline = sharp(image);
    if (width) {
      pipeline = pipeline.resize({ width, withoutEnlargement: true });
    }
    return new Success(await pipeline.webp().toBuffer());
  } catch (e) {
    return toFailure(e);
  }
};
