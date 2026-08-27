import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";

import { getPhoto, NotFoundError } from "../s3.ts";
import { toWatermarkedWebp, toWebp } from "../sharp.ts";

const THUMBNAIL_WIDTH = 600;

const logger = new Logger({ serviceName: "photo" });

// `<name>_thumbnail.<ext>` is a virtual path: no such object exists in the
// bucket, the original `<name>.<ext>` is fetched and resized on the fly.
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

  const resultToWebp = thumbnailSourceKey
    ? await toWebp(resultForGetPhoto.value, THUMBNAIL_WIDTH)
    : await toWatermarkedWebp(resultForGetPhoto.value);
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
