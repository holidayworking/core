import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import type { IBucket } from "aws-cdk-lib/aws-s3";

import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { DeployTimeSubstitutedFile } from "aws-cdk-lib/aws-s3-deployment";
import { Schedule, ScheduleExpression, ScheduleTargetInput } from "aws-cdk-lib/aws-scheduler";
import { LambdaInvoke } from "aws-cdk-lib/aws-scheduler-targets";
import * as cdk from "aws-cdk-lib/core";
import capitalize from "capitalize";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { CloudFrontInvalidator } from "./constructs/cloudfront-invalidator.ts";
import { FeedGenerator } from "./constructs/feed-generator.ts";
import { RadikoRecorder } from "./constructs/radiko-recorder.ts";
import { Storage } from "./constructs/storage.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type Definition = {
  id: string;
  title: string;
  author: string;
  image: string;
  area: string;
  station: string;
  programSchedules: string[];
  executionSchedule: string;
};

interface RadicastStackProps extends cdk.StackProps {
  readonly certificate: ICertificate;
  readonly hostedZoneId: string;
  readonly zoneName: string;
  readonly definitions: Definition[];
}

export class RadicastStack extends cdk.Stack {
  public readonly distribution: IDistribution;
  public readonly distributionLogsBucket: IBucket;

  constructor(scope: Construct, id: string, props: RadicastStackProps) {
    super(scope, id, props);

    const { certificate, hostedZoneId, zoneName, definitions } = props;

    const {
      bucket,
      distribution,
      distributionLogsBucket,
      basicAuthenticationCredentialKeyValueStore,
    } = new Storage(this, "Storage", {
      certificate,
      hostedZoneId,
      zoneName,
    });

    this.distribution = distribution;
    this.distributionLogsBucket = distributionLogsBucket;

    const radikoRecorder = new RadikoRecorder(this, "RadikoRecorder", { bucket });

    new FeedGenerator(this, "FeedGenerator", {
      bucket,
      basicAuthenticationCredentialKeyValueStore,
      zoneName,
    });

    new CloudFrontInvalidator(this, "CloudFrontInvalidator", {
      distribution,
      bucket,
    });

    const role = new Role(this, "SchedulerRole", {
      assumedBy: new ServicePrincipal("scheduler.amazonaws.com"),
      inlinePolicies: {
        InvokeLambdaPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ["lambda:InvokeFunction"],
              resources: [radikoRecorder.function.functionArn],
            }),
          ],
        }),
      },
    }).withoutPolicyUpdates();

    for (const definition of definitions) {
      const { id, title, author, image, area, station, programSchedules, executionSchedule } =
        definition;

      new DeployTimeSubstitutedFile(this, `${capitalize(id)}ConfigFile`, {
        destinationBucket: bucket,
        source: join(__dirname, "config.json"),
        substitutions: {
          id,
          title,
          author,
          image,
          area,
          station,
          programSchedules: JSON.stringify(programSchedules),
          executionSchedule,
        },
        destinationKey: `${id}/config.json`,
      });

      new Schedule(this, `${capitalize(id)}Schedule`, {
        schedule: ScheduleExpression.expression(
          `cron(${definition.executionSchedule})`,
          cdk.TimeZone.ASIA_TOKYO,
        ),
        target: new LambdaInvoke(radikoRecorder.function, {
          input: ScheduleTargetInput.fromObject({
            id,
          }),
          role,
        }),
      });
    }

    NagSuppressions.addResourceSuppressionsByPath(
      this,
      "/RadicastStack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C/Resource", // cspell:disable-line
      [
        {
          id: "AwsSolutions-L1",
          reason:
            "CDK BucketDeployment custom resource Lambda runtime is managed by CDK and cannot be configured by the user.",
        },
      ],
    );

    NagSuppressions.addResourceSuppressionsByPath(
      this,
      "/RadicastStack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C/ServiceRole/DefaultPolicy/Resource", // cspell:disable-line
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "CDK BucketDeployment custom resource requires S3 wildcard permissions to copy assets from the CDK staging bucket and manage files in the destination bucket. These permissions are managed by CDK and cannot be scoped down further.",
        },
      ],
    );
  }
}
