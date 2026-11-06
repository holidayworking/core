import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Success, toFailure } from "@core/utils";

const client = new S3Client({});

export const saveFeed = async (bucket: string, id: string, feed: string) => {
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `${id}/index.rss`,
        Body: feed,
      }),
    );
    return new Success("");
  } catch (e) {
    return toFailure(e);
  }
};
