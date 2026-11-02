import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { getParameter } from "@aws-lambda-powertools/parameters/ssm";
import { Failure } from "@core/utils";
import middy from "@middy/core";
import { rmSync } from "fs";

import type { Definition } from "../../definition.ts";

import { recordRadiruEpisode } from "../../radiru.ts";
import { recordEpisode } from "../../recorder.ts";
import { findDefinition, saveEpisode } from "../../s3.ts";

const logger = new Logger({ serviceName: "radicast" });

const lambdaHandler = async (event: { id: string }) => {
  const bucket = process.env.BUCKET;
  if (!bucket) {
    logger.error("Environment variable BUCKET is not set");
    return;
  }

  const { id } = event;

  const resultForFindDefinition = await findDefinition(bucket, id);
  if (resultForFindDefinition.isFailure()) {
    logger.error("unexpected error", resultForFindDefinition.error);
    return;
  }
  const definition = resultForFindDefinition.value;

  const resultForRecordEpisode = await record(definition);
  if (resultForRecordEpisode.isFailure()) {
    logger.error("unexpected error", resultForRecordEpisode.error);
    return;
  }
  const episode = resultForRecordEpisode.value;

  const resultForSaveEpisode = await saveEpisode(bucket, id, episode);
  // /tmp is kept between invocations on a warm Lambda container.
  if (episode.localPath) {
    rmSync(episode.localPath, { force: true });
  }
  if (resultForSaveEpisode.isFailure()) {
    logger.error("unexpected error", resultForSaveEpisode.error);
    return;
  }
};

const record = async (definition: Definition) => {
  if (definition.service === "radiru") {
    return await recordRadiruEpisode(definition);
  }

  const radikoMail = await getParameter("/app/radicast/radiko_mail");
  const radikoPassword = await getParameter("/app/radicast/radiko_password", { decrypt: true });

  if (!radikoMail || !radikoPassword) {
    return new Failure(new Error("Radiko credentials are not configured"));
  }

  return await recordEpisode(radikoMail, radikoPassword, definition);
};

export const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
