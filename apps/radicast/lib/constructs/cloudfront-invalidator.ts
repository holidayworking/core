import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";

import { Duration } from "aws-cdk-lib";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { EventType, type IBucket } from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

type Props = {
  readonly distribution: IDistribution;
  readonly bucket: IBucket;
};

export class CloudFrontInvalidator extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { distribution, bucket } = props;

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
        format: OutputFormat.ESM,
        minify: true,
        platform: "linux/arm64",
        sourceMap: true,
      },
      entry: join(
        __dirname,
        "..",
        "..",
        "lambda",
        "functions",
        "cloudfront-invalidator",
        "index.ts",
      ),
      environment: {
        DISTRIBUTION_ID: distribution.distributionId,
      },
      logGroup,
      role,
      runtime: Runtime.NODEJS_24_X,
    });

    distribution.grantCreateInvalidation(func);

    bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(func), {
      suffix: ".rss",
    });
  }
}
