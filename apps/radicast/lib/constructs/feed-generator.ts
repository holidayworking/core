import type { IKeyValueStore } from "aws-cdk-lib/aws-cloudfront";

import { Duration } from "aws-cdk-lib";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { EventType, type IBucket } from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

type Props = {
  readonly bucket: IBucket;
  readonly basicAuthenticationCredentialKeyValueStore: IKeyValueStore;
  readonly zoneName: string;
};

export class FeedGenerator extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { bucket, basicAuthenticationCredentialKeyValueStore, zoneName } = props;

    const role = new Role(this, "ServiceRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    const logGroup = new LogGroup(this, "LogGroup", {
      retention: RetentionDays.ONE_WEEK,
    });

    logGroup.grantWrite(role);

    const func = new NodejsFunction(this, "Function", {
      architecture: Architecture.ARM_64,
      bundling: {
        banner:
          "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
        commandHooks: {
          afterBundling: (inputDir, outputDir) => [
            `cp ${join(
              inputDir,
              "apps/radicast/lambda/functions/feed-generator/podcast.xml.ejs",
            )} ${join(outputDir, "podcast.xml.ejs")}`,
          ],
          beforeBundling: () => [],
          beforeInstall: () => [],
        },
        format: OutputFormat.ESM,
        minify: true,
        platform: "linux/arm64",
        sourceMap: true,
      },
      entry: join(__dirname, "..", "..", "lambda", "functions", "feed-generator", "index.ts"),
      environment: {
        DOMAIN_NAME: `radicast.${zoneName}`,
        BASIC_AUTHENTICATION_CREDENTIAL_KEY_VALUE_STORE_ARN:
          basicAuthenticationCredentialKeyValueStore.keyValueStoreArn,
      },
      logGroup,
      role,
      runtime: Runtime.NODEJS_24_X,
      timeout: Duration.minutes(15),
    });

    func.addToRolePolicy(
      new PolicyStatement({
        actions: ["cloudfront-keyvaluestore:GetKey"],
        resources: [basicAuthenticationCredentialKeyValueStore.keyValueStoreArn],
      }),
    );

    func.addToRolePolicy(
      new PolicyStatement({
        actions: ["s3:ListBucket"],
        resources: [bucket.bucketArn],
      }),
    );

    func.addToRolePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject", "s3:PutObject"],
        resources: [bucket.arnForObjects("*")],
      }),
    );

    bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(func), {
      suffix: ".m4a",
    });

    bucket.addEventNotification(EventType.OBJECT_REMOVED, new LambdaDestination(func), {
      suffix: ".m4a",
    });

    bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(func), {
      suffix: "config.json",
    });

    NagSuppressions.addResourceSuppressions(
      role,
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Lambda requires read and write access to all objects in the S3 bucket.",
          appliesTo: ["Resource::<StorageBucket13B7643F.Arn>/*"],
        },
      ],
      true,
    );
  }
}
