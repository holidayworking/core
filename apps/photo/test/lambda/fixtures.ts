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

// In sharp's `Exif`, IFD2 is the Exif SubIFD and IFD3 is the GPS IFD.
export const CAPTURED_EXIF: Exif = {
  IFD0: { Make: "Xiaomi", Model: "15 Ultra" },
  IFD2: {
    DateTimeOriginal: "2026:08:15 11:56:24",
    ExposureTime: "1/100",
    FNumber: "163/100",
    FocalLengthIn35mmFilm: "23",
    ISOSpeedRatings: "80",
  },
  IFD3: {
    GPSLatitude: "35/1 27/1 50/1",
    GPSLatitudeRef: "N",
    GPSLongitude: "139/1 37/1 12/1",
    GPSLongitudeRef: "E",
  },
};
