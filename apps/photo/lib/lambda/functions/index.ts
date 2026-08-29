import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";

import { logger } from "../logger.ts";
import { getPhoto, NotFoundError } from "../s3.ts";
import { toWatermarkedWebp, toWebp } from "../sharp.ts";

const THUMBNAIL_WIDTH = 600;

// `path/to/photo_thumbnail.jpg` is served from the original `path/to/photo.jpg`.
const resolveThumbnailSourceKey = (key: string) => {
  const match = /^(.+)_thumbnail(\.[^/.]+)$/.exec(key);
  if (!match) {
    return undefined;
  }
  const [, name, extension] = match;
  return `${name}${extension}`;
};

const lambdaHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    logger.error("Environment variable BUCKET_NAME is not set");
    return { statusCode: 500 };
  }

  const requestedKey = decodeURIComponent(event.rawPath.replace(/^\/+/, ""));
  if (requestedKey === "") {
    return { statusCode: 404 };
  }

  const thumbnailSourceKey = resolveThumbnailSourceKey(requestedKey);
  const key = thumbnailSourceKey ?? requestedKey;

  const resultForGetPhoto = await getPhoto(bucket, key);
  if (resultForGetPhoto.isFailure()) {
    if (resultForGetPhoto.error instanceof NotFoundError) {
      return { statusCode: 404 };
    }
    logger.error("unexpected error", resultForGetPhoto.error);
    return { statusCode: 500 };
  }

  const resultToWebp = await (thumbnailSourceKey
    ? toWebp(resultForGetPhoto.value, THUMBNAIL_WIDTH)
    : toWatermarkedWebp(resultForGetPhoto.value));
  if (resultToWebp.isFailure()) {
    logger.error("unexpected error", resultToWebp.error);
    return { statusCode: 500 };
  }

  return {
    statusCode: 200,
    headers: {
      "Cache-Control": "public, max-age=31536000",
      "Content-Type": "image/webp",
    },
    body: resultToWebp.value.toString("base64"),
    isBase64Encoded: true,
  };
};

export const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
