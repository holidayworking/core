import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";

import { Failure, Success } from "./result.ts";

const client = new CloudFrontClient({});

export const cloudFrontInvalidation = async (distributionId: string, path: string[]) => {
  try {
    await client.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: path,
          },
          CallerReference: Math.floor(Date.now() / 1000).toString(),
        },
      }),
    );
    return new Success("");
  } catch (e) {
    if (e instanceof Error) {
      return new Failure(e);
    } else {
      return new Failure(new Error());
    }
  }
};
