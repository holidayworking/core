import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import exifReader from "exif-reader";

import { logger } from "./logger.ts";

export type Watermark = {
  readonly dateTime?: string;
  readonly device?: string;
  readonly exposure?: string;
  readonly location?: string;
};

type Photo = NonNullable<ReturnType<typeof exifReader>["Photo"]>;
type GpsInfo = NonNullable<ReturnType<typeof exifReader>["GPSInfo"]>;

const round = (value: number, digits: number) => Number(value.toFixed(digits)).toString();

// Some EXIF fields (ISOSpeedRatings, for one) are decoded as an array of values.
const toNumber = (value: unknown) => {
  const numeric: unknown = Array.isArray(value) ? value[0] : value;
  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : undefined;
};

const pad = (value: number) => value.toString().padStart(2, "0");

const formatDateTime = (dateTime: Date) => format(dateTime, "yyyy.MM.dd HH:mm", { in: tz("UTC") });

const formatCoordinate = (coordinate: number[], ref: string) => {
  const [degrees = 0, minutes = 0, seconds = 0] = coordinate;
  // Rounding the whole angle keeps a value such as 59'59.6" from printing as 59'60".
  const total = Math.round(degrees * 3600 + minutes * 60 + seconds);
  return `${Math.floor(total / 3600)}°${pad(Math.floor(total / 60) % 60)}'${pad(total % 60)}"${ref}`;
};

const formatExposureTime = (seconds: number) =>
  seconds >= 1 ? `${round(seconds, 1)}s` : `1/${Math.round(1 / seconds)}s`;

const formatExposure = (photo: Photo) => {
  const focalLength = toNumber(photo.FocalLengthIn35mmFilm) ?? toNumber(photo.FocalLength);
  const fNumber = toNumber(photo.FNumber);
  const exposureTime = toNumber(photo.ExposureTime);
  const iso = toNumber(photo.ISOSpeedRatings);
  const parts = [
    focalLength ? `${round(focalLength, 1)}mm` : undefined,
    fNumber ? `f/${round(fNumber, 2)}` : undefined,
    exposureTime ? formatExposureTime(exposureTime) : undefined,
    iso ? `ISO${round(iso, 0)}` : undefined,
  ].filter((part) => part !== undefined);
  return parts.join(" ") || undefined;
};

const formatLocation = (gps: GpsInfo) => {
  const { GPSLatitude: latitude, GPSLatitudeRef: latitudeRef } = gps;
  const { GPSLongitude: longitude, GPSLongitudeRef: longitudeRef } = gps;
  if (!latitude || !latitudeRef || !longitude || !longitudeRef) {
    return undefined;
  }
  return [formatCoordinate(latitude, latitudeRef), formatCoordinate(longitude, longitudeRef)].join(
    " ",
  );
};

// Each field is read on its own so that one unreadable field does not drop the others.
const read = <T>(field: string, reader: () => T | undefined) => {
  try {
    return reader();
  } catch (e) {
    logger.warn("could not read EXIF", { error: e, field });
    return undefined;
  }
};

export const readWatermark = (exif: Buffer | undefined): Watermark => {
  if (!exif) {
    return {};
  }

  const parsed = read("exif", () => exifReader(exif));
  if (!parsed) {
    return {};
  }

  const { GPSInfo: gps, Image: image, Photo: photo } = parsed;
  const dateTime = photo?.DateTimeOriginal;
  return {
    dateTime: read("dateTime", () => (dateTime ? formatDateTime(dateTime) : undefined)),
    device: read("device", () => image?.Model?.trim()),
    exposure: read("exposure", () => (photo ? formatExposure(photo) : undefined)),
    location: read("location", () => (gps ? formatLocation(gps) : undefined)),
  };
};
