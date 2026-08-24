import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { Success, toFailure } from "@core/utils";

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
    return toFailure(e);
  }
};
