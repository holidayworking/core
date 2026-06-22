import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { getParameter } from "@aws-lambda-powertools/parameters/ssm";
import middy from "@middy/core";

import { recordEpisode } from "../../recorder.ts";
import { findDefinition, saveEpisode } from "../../s3.ts";

const logger = new Logger({ serviceName: "radicast" });

const lambdaHandler = async (event: { id: string }) => {
  const bucket = process.env.BUCKET;
  if (!bucket) {
    logger.error("Environment variable BUCKET is not set");
    return;
  }

  const radikoMail = await getParameter("/app/radicast/radiko_mail");
  const radikoPassword = await getParameter("/app/radicast/radiko_password", { decrypt: true });

  if (!radikoMail || !radikoPassword) {
    logger.error("Radiko credentials are not configured");
    return;
  }

  const { id } = event;

  const resultForFindDefinition = await findDefinition(bucket, id);
  if (resultForFindDefinition.isFailure()) {
    logger.error("unexpected error", resultForFindDefinition.error);
    return;
  }
  const definition = resultForFindDefinition.value;

  const resultForRecordEpisode = await recordEpisode(radikoMail, radikoPassword, definition);
  if (resultForRecordEpisode.isFailure()) {
    logger.error("unexpected error", resultForRecordEpisode.error);
    return;
  }
  const episode = resultForRecordEpisode.value;

  const resultForSaveEpisode = await saveEpisode(bucket, id, episode);
  if (resultForSaveEpisode.isFailure()) {
    logger.error("unexpected error", resultForSaveEpisode.error);
    return;
  }
};

export const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
