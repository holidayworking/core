import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import type { IBucket } from "aws-cdk-lib/aws-s3";

import { Validations } from "aws-cdk-lib";
import {
  Distribution,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { FunctionUrlOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import {
  Architecture,
  Code,
  FunctionUrlAuthType,
  LayerVersion,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket, BucketNamespace } from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface PhotoStackProps extends cdk.StackProps {
  readonly certificate: ICertificate;
  readonly hostedZoneId: string;
  readonly zoneName: string;
}

export class PhotoStack extends cdk.Stack {
  public readonly distribution: IDistribution;
  public readonly distributionLogsBucket: IBucket;

  constructor(scope: Construct, id: string, props: PhotoStackProps) {
    super(scope, id, props);

    const { certificate, hostedZoneId, zoneName } = props;

    const bucket = new Bucket(this, "Bucket", {
      bucketNamePrefix: "photo",
      bucketNamespace: BucketNamespace.ACCOUNT_REGIONAL,
      enforceSSL: true,
      versioned: true,
    });

    Validations.of(bucket).acknowledge({
      id: "AwsSolutions::AwsSolutions-S1",
      reason: "Access logs are not required.",
    });

    const role = new Role(this, "FunctionServiceRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    const logGroup = new LogGroup(this, "FunctionLogGroup", {
      retention: RetentionDays.ONE_WEEK,
    });

    logGroup.grantWrite(role);

    const fontsLayer = new LayerVersion(this, "FontsLayer", {
      code: Code.fromDockerBuild(join(__dirname, "docker", "fonts"), {
        cacheFrom: [{ type: "gha" }],
        cacheTo: { type: "gha", params: { mode: "max" } },
      }),
    });

    const func = new NodejsFunction(this, "Function", {
      architecture: Architecture.ARM_64,
      bundling: {
        banner:
          "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
        forceDockerBundling: true,
        format: OutputFormat.ESM,
        minify: true,
        nodeModules: ["sharp"],
        platform: "linux/arm64",
        sourceMap: true,
      },
      entry: join(__dirname, "lambda", "functions", "index.ts"),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        FONTCONFIG_PATH: "/opt/fonts",
      },
      layers: [fontsLayer],
      logGroup,
      memorySize: 2048,
      role,
      runtime: Runtime.NODEJS_24_X,
      timeout: cdk.Duration.seconds(30),
    });

    func.addToRolePolicy(
      new PolicyStatement({
        actions: ["s3:ListBucket"],
        resources: [bucket.bucketArn],
      }),
    );

    func.addToRolePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [bucket.arnForObjects("*")],
      }),
    );

    Validations.of(role).acknowledge({
      id: "AwsSolutions-IAM5[Resource::<Bucket83908E77.Arn>/*]",
      reason: "The function must be able to read any object in the bucket by request path.",
    });

    const funcUrl = func.addFunctionUrl({
      authType: FunctionUrlAuthType.AWS_IAM,
    });

    const zone = PublicHostedZone.fromPublicHostedZoneAttributes(this, "Zone", {
      hostedZoneId,
      zoneName,
    });

    this.distribution = new Distribution(this, "Distribution", {
      certificate,
      defaultBehavior: {
        origin: FunctionUrlOrigin.withOriginAccessControl(funcUrl, {}),
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
      },
      domainNames: [`photo.${zone.name}`],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // `FunctionUrlOrigin.withOriginAccessControl` only grants `lambda:InvokeFunctionUrl`,
    // but CloudFront also needs `lambda:InvokeFunction` to call the origin via OAC.
    // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html#oac-permission-to-access-lambda
    func.addPermission("AllowCloudFrontServicePrincipalInvokeFunction", {
      principal: new ServicePrincipal("cloudfront.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:${cdk.Aws.PARTITION}:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/${this.distribution.distributionId}`,
    });

    this.distributionLogsBucket = Bucket.fromBucketAttributes(this, "DistributionLogsBucket", {
      bucketName: `cloudfront-access-logs-${this.account}-${this.region}-an`,
    });

    new ARecord(this, "DistributionAliasRecord", {
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      zone,
      recordName: "photo",
    });

    Validations.of(this.distribution).acknowledge(
      {
        id: "AwsSolutions::AwsSolutions-CFR1",
        reason: "Geo restrictions are not required for this distribution.",
      },
      {
        id: "AwsSolutions::AwsSolutions-CFR2",
        reason: "AWS WAF is not required for static file distribution.",
      },
      {
        id: "AwsSolutions::AwsSolutions-CFR3",
        reason:
          "Access logs are configured with Standard logging (v2), which cdk-nag does not support yet.",
      },
    );
  }
}
