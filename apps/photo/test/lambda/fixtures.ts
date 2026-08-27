import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import type { Exif } from "sharp";

import sharp from "sharp";

export const createContext = () =>
  ({
    awsRequestId: "00000000-0000-0000-0000-000000000000",
    functionName: "photo-test",
    functionVersion: "$LATEST",
    invokedFunctionArn: "arn:aws:lambda:ap-northeast-1:123456789012:function:photo-test",
    memoryLimitInMB: "128",
    getRemainingTimeInMillis: () => 1000,
  }) as unknown as Context;

export const createEvent = (rawPath: string) =>
  ({
    rawPath,
  }) as unknown as APIGatewayProxyEventV2;

export const createPhoto = async (options: {
  exif?: Exif;
  height: number;
  orientation?: number;
  width: number;
}) => {
  const { exif, height, orientation, width } = options;
  let pipeline = sharp({
    create: { background: { b: 160, g: 120, r: 90 }, channels: 3, height, width },
  });
  if (exif) {
    pipeline = pipeline.withExif(exif);
  }
  if (orientation) {
    pipeline = pipeline.withMetadata({ orientation });
  }
  return await pipeline.jpeg().toBuffer();
};

export const createExif = async (exif: Exif) => {
  const photo = await createPhoto({ exif, height: 2, width: 2 });
  const { exif: buffer } = await sharp(photo).metadata();
  return buffer;
};
