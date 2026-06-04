import type { S3Event } from "aws-lambda";

import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import "@aws-sdk/signature-v4a";
import middy from "@middy/core";

import { cloudFrontInvalidation } from "../../cloudfront.ts";

const logger = new Logger({ serviceName: "radicast" });

const lambdaHandler = async (event: S3Event) => {
  const distributionId = process.env.DISTRIBUTION_ID;
  if (!distributionId) {
    logger.error("Environment variable DISTRIBUTION_ID is not set");
    return;
  }

  const paths = event.Records.map((record) => `/${record.s3.object.key}`);
  const result = await cloudFrontInvalidation(distributionId, paths);
  if (result.isFailure()) {
    logger.error("unexpected error", result.error);
    return;
  }
};

export const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
