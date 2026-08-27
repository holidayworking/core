import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import exifReader from "exif-reader";

export type Watermark = {
  readonly dateTime?: string;
  readonly exposure?: string;
  readonly location?: string;
};

type Photo = NonNullable<ReturnType<typeof exifReader>["Photo"]>;
type GpsInfo = NonNullable<ReturnType<typeof exifReader>["GPSInfo"]>;

const round = (value: number, digits: number) => Number(value.toFixed(digits)).toString();

const pad = (value: number) => value.toString().padStart(2, "0");

// EXIF timestamps carry no timezone and exif-reader turns them into UTC
// `Date`s, so formatting must stay in UTC to print back the camera's clock.
const formatDateTime = (dateTime: Date) => format(dateTime, "yyyy.MM.dd HH:mm", { in: tz("UTC") });

const formatCoordinate = (coordinate: number[], ref: string) => {
  const [degrees = 0, minutes = 0, seconds = 0] = coordinate;
  // Rounding the combined seconds lets a fractional minute carry into the
  // seconds instead of being truncated away.
  const total = Math.round(degrees * 3600 + minutes * 60 + seconds);
  return `${Math.floor(total / 3600)}°${pad(Math.floor(total / 60) % 60)}'${pad(total % 60)}"${ref}`;
};

const formatExposureTime = (seconds: number) =>
  seconds >= 1 ? `${round(seconds, 1)}s` : `1/${Math.round(1 / seconds)}s`;

const formatExposure = (photo: Photo) => {
  const focalLength = photo.FocalLengthIn35mmFilm ?? photo.FocalLength;
  const parts = [
    focalLength ? `${round(focalLength, 1)}mm` : undefined,
    photo.FNumber ? `f/${round(photo.FNumber, 2)}` : undefined,
    photo.ExposureTime ? formatExposureTime(photo.ExposureTime) : undefined,
    photo.ISOSpeedRatings ? `ISO${Math.round(photo.ISOSpeedRatings).toString()}` : undefined,
  ].filter((part) => part !== undefined);
  return parts.length > 0 ? parts.join(" ") : undefined;
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

export const readWatermark = (exif: Buffer | undefined): Watermark => {
  if (!exif) {
    return {};
  }

  try {
    const { GPSInfo: gps, Photo: photo } = exifReader(exif);
    const dateTime = photo?.DateTimeOriginal;
    return {
      dateTime: dateTime ? formatDateTime(dateTime) : undefined,
      exposure: photo ? formatExposure(photo) : undefined,
      location: gps ? formatLocation(gps) : undefined,
    };
  } catch {
    // A malformed EXIF block should cost only the watermark, not the conversion.
    return {};
  }
};
