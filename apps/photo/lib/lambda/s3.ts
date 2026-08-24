import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Failure, Success, toFailure } from "@core/utils";

const client = new S3Client({});

export class NotFoundError extends Error {}

export const getPhoto = async (bucket: string, key: string) => {
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = response.Body;
    if (!body) {
      return new Failure(new Error("body is undefined"));
    }
    return new Success(await body.transformToByteArray());
  } catch (e) {
    if (e instanceof Error && e.name === "NoSuchKey") {
      return new Failure(new NotFoundError(e.message));
    }
    return toFailure(e);
  }
};
