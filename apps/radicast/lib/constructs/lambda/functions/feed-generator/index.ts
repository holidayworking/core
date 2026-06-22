import type { S3Event } from "aws-lambda";

import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import "@aws-sdk/signature-v4a";
import { tz } from "@date-fns/tz";
import middy from "@middy/core";
import { format } from "date-fns";
import ejs from "ejs";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { findBasicAuthenticationCredential } from "../../cloudfront-keyvaluestore.ts";
import { findDefinition, listEpisodes, saveFeed } from "../../s3.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const logger = new Logger({ serviceName: "radicast" });

const lambdaHandler = async (event: S3Event) => {
  const domainName = process.env.DOMAIN_NAME;
  if (!domainName) {
    logger.error("Environment variable DOMAIN_NAME is not set");
    return;
  }

  const basicAuthenticationCredentialKeyValueStoreArn =
    process.env.BASIC_AUTHENTICATION_CREDENTIAL_KEY_VALUE_STORE_ARN;
  if (!basicAuthenticationCredentialKeyValueStoreArn) {
    logger.error(
      "Environment variable BASIC_AUTHENTICATION_CREDENTIAL_KEY_VALUE_STORE_ARN is not set",
    );
    return;
  }

  const resultForFindBasicAuthenticationCredential = await findBasicAuthenticationCredential(
    basicAuthenticationCredentialKeyValueStoreArn,
  );
  if (resultForFindBasicAuthenticationCredential.isFailure()) {
    logger.error("unexpected error", resultForFindBasicAuthenticationCredential.error);
    return;
  }
  const basicAuthenticationCredential = resultForFindBasicAuthenticationCredential.value;

  const url = new URL(`https://${domainName}`);
  url.username = basicAuthenticationCredential.username;
  url.password = basicAuthenticationCredential.password;

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const id = dirname(record.s3.object.key);

    const resultForFindDefinition = await findDefinition(bucket, id);
    if (resultForFindDefinition.isFailure()) {
      logger.error("unexpected error", resultForFindDefinition.error);
      return;
    }
    const definition = resultForFindDefinition.value;

    const resultForListEpisodes = await listEpisodes(bucket, id, url.toString());
    if (resultForListEpisodes.isFailure()) {
      logger.error("unexpected error", resultForListEpisodes.error);
      return;
    }
    const episodes = resultForListEpisodes.value;

    const template = readFileSync(join(__dirname, "podcast.xml.ejs"), "utf-8");
    const feed = ejs.render(template, { format, tz, definition, episodes });
    logger.info("feed generated", { id, episodesCount: episodes.length });
    const resultForSaveFeed = await saveFeed(bucket, id, feed);
    if (resultForSaveFeed.isFailure()) {
      logger.error("unexpected error", resultForSaveFeed.error);
      return;
    }
  }
};

export const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
