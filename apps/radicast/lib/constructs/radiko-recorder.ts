import type { IBucket } from "aws-cdk-lib/aws-s3";

import { Duration, ScopedAws } from "aws-cdk-lib";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Architecture, Code, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

type Props = {
  readonly bucket: IBucket;
};

export class RadikoRecorder extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { bucket } = props;

    const { accountId, region } = new ScopedAws(this);

    const role = new Role(this, "ServiceRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    const logGroup = new LogGroup(this, "LogGroup", {
      retention: RetentionDays.ONE_WEEK,
    });

    logGroup.grantWrite(role);

    const radigoLayer = new LayerVersion(this, "RadigoLayer", {
      code: Code.fromDockerBuild(join(__dirname, "..", "..", "docker", "radigo"), {
        cacheFrom: [{ type: "gha" }],
        cacheTo: { type: "gha", params: { mode: "max" } },
      }),
    });

    this.function = new NodejsFunction(this, "Function", {
      architecture: Architecture.ARM_64,
      bundling: {
        banner:
          "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
        format: OutputFormat.ESM,
        minify: true,
        platform: "linux/arm64",
        sourceMap: true,
      },
      entry: join(__dirname, "..", "..", "lambda", "functions", "radiko-recorder", "index.ts"),
      environment: {
        BUCKET: bucket.bucketName,
      },
      layers: [radigoLayer],
      logGroup,
      memorySize: 1024,
      role,
      runtime: Runtime.NODEJS_24_X,
      timeout: Duration.minutes(15),
    });

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${region}:${accountId}:parameter/app/radicast/radiko_mail`,
          `arn:aws:ssm:${region}:${accountId}:parameter/app/radicast/radiko_password`,
        ],
      }),
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ["s3:ListBucket"],
        resources: [bucket.bucketArn],
      }),
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject", "s3:PutObject"],
        resources: [bucket.arnForObjects("*")],
      }),
    );

    NagSuppressions.addResourceSuppressions(
      role,
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Required to grant read and write access to all objects in the bucket.",
          appliesTo: ["Resource::<StorageBucket13B7643F.Arn>/*"],
        },
      ],
      true,
    );
  }
}
