import { Logger } from "@aws-lambda-powertools/logger";
import { Failure, Success } from "@core/utils";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { handler } from "../../../lib/lambda/functions/index.ts";
import { getPhoto, NotFoundError } from "../../../lib/lambda/s3.ts";
import { toWebp } from "../../../lib/lambda/sharp.ts";
import { createContext, createEvent } from "../fixtures.ts";

vi.mock("../../../lib/lambda/s3.ts");
vi.mock("../../../lib/lambda/sharp.ts");

const getPhotoMock = vi.mocked(getPhoto);
const toWebpMock = vi.mocked(toWebp);

const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BUCKET_NAME", "bucket");
  getPhotoMock.mockResolvedValue(new Success(new Uint8Array([1, 2, 3])));
  toWebpMock.mockResolvedValue(new Success(Buffer.from([4, 5, 6])));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("returns the converted image as a base64 body", async () => {
  const result = await handler(createEvent("/travel/photo.jpg"), createContext());

  expect(getPhotoMock).toHaveBeenCalledExactlyOnceWith("bucket", "travel/photo.jpg");
  expect(toWebpMock).toHaveBeenCalledExactlyOnceWith(new Uint8Array([1, 2, 3]), undefined);
  expect(result).toStrictEqual({
    body: Buffer.from([4, 5, 6]).toString("base64"),
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000" },
    isBase64Encoded: true,
    statusCode: 200,
  });
  expect(errorSpy).not.toHaveBeenCalled();
});

test("decodes the request path and strips leading slashes", async () => {
  await handler(createEvent("//travel/my%20photo.jpg"), createContext());

  expect(getPhotoMock).toHaveBeenCalledExactlyOnceWith("bucket", "travel/my photo.jpg");
});

test("returns 500 when BUCKET_NAME is not set", async () => {
  vi.stubEnv("BUCKET_NAME", undefined);

  const result = await handler(createEvent("/travel/photo.jpg"), createContext());

  expect(result).toStrictEqual({ statusCode: 500 });
  expect(errorSpy).toHaveBeenCalledWith("Environment variable BUCKET is not set");
  expect(getPhotoMock).not.toHaveBeenCalled();
});

test("returns 404 when the request path is empty", async () => {
  const result = await handler(createEvent("/"), createContext());

  expect(result).toStrictEqual({ statusCode: 404 });
  expect(getPhotoMock).not.toHaveBeenCalled();
});

test("returns 404 when the object does not exist", async () => {
  getPhotoMock.mockResolvedValue(new Failure(new NotFoundError("not found")));

  const result = await handler(createEvent("/travel/photo.jpg"), createContext());

  expect(result).toStrictEqual({ statusCode: 404 });
  expect(errorSpy).not.toHaveBeenCalled();
  expect(toWebpMock).not.toHaveBeenCalled();
});

test("returns 500 and logs when getPhoto fails for another reason", async () => {
  const error = new Error("access denied");
  getPhotoMock.mockResolvedValue(new Failure(error));

  const result = await handler(createEvent("/travel/photo.jpg"), createContext());

  expect(result).toStrictEqual({ statusCode: 500 });
  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
});

test("returns 500 and logs when toWebp fails", async () => {
  const error = new Error("unsupported format");
  toWebpMock.mockResolvedValue(new Failure(error));

  const result = await handler(createEvent("/travel/photo.jpg"), createContext());

  expect(result).toStrictEqual({ statusCode: 500 });
  expect(errorSpy).toHaveBeenCalledWith("unexpected error", error);
});

test("fetches the source image and converts it to WebP at the thumbnail width when the path has a _thumbnail suffix", async () => {
  const result = await handler(createEvent("/travel/photo_thumbnail.jpg"), createContext());

  expect(getPhotoMock).toHaveBeenCalledExactlyOnceWith("bucket", "travel/photo.jpg");
  expect(toWebpMock).toHaveBeenCalledExactlyOnceWith(new Uint8Array([1, 2, 3]), 600);
  expect(result).toStrictEqual({
    body: Buffer.from([4, 5, 6]).toString("base64"),
    headers: { "Cache-Control": "public, max-age=31536000", "Content-Type": "image/webp" },
    isBase64Encoded: true,
    statusCode: 200,
  });
});

test("does not pass a width when the path has no _thumbnail suffix", async () => {
  await handler(createEvent("/travel/photo.jpg"), createContext());

  expect(toWebpMock).toHaveBeenCalledExactlyOnceWith(new Uint8Array([1, 2, 3]), undefined);
});

test("does not treat _thumbnail as a suffix when it is not immediately before the extension", async () => {
  await handler(createEvent("/travel/thumbnail_gallery/photo.jpg"), createContext());

  expect(getPhotoMock).toHaveBeenCalledExactlyOnceWith(
    "bucket",
    "travel/thumbnail_gallery/photo.jpg",
  );
  expect(toWebpMock).toHaveBeenCalledExactlyOnceWith(new Uint8Array([1, 2, 3]), undefined);
});
