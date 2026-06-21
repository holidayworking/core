import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import type { IBucket } from "aws-cdk-lib/aws-s3";

import { AWS_MAIN_ACCOUNT_ID } from "@core/constants";
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { DeployTimeSubstitutedFile } from "aws-cdk-lib/aws-s3-deployment";
import { Schedule, ScheduleExpression, ScheduleTargetInput } from "aws-cdk-lib/aws-scheduler";
import { LambdaInvoke } from "aws-cdk-lib/aws-scheduler-targets";
import * as cdk from "aws-cdk-lib/core";
import capitalize from "capitalize";
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

    // The IAM4 finding references an AWS managed policy ARN, which contains
    // multiple "::". Validations.acknowledge() rejects such IDs
    // (https://github.com/cdklabs/cdk-nag/issues/2351), so write the
    // acknowledgment metadata directly. Recorded on the stack so it covers both
    // the bucket notifications handler and the bucket deployment service roles.
    this.node.addMetadata(cdk.Validations.ACKNOWLEDGED_RULES_METADATA_KEY, {
      "AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole]":
        "CDK-managed S3 bucket notifications handler requires AWSLambdaBasicExecutionRole.",
    });

    const bucketDeployment = this.node.findChild(
      "Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C", // cspell:disable-line
    );

    cdk.Validations.of(bucketDeployment).acknowledge(
      {
        id: "AwsSolutions-L1",
        reason: "CDK BucketDeployment Lambda runtime is managed by CDK and cannot be configured.",
      },
      {
        id: "AwsSolutions-IAM5[Action::s3:GetBucket*]",
        reason:
          "CDK BucketDeployment requires wildcard S3 permissions to manage assets, which are managed by CDK and cannot be scoped down.",
      },
      {
        id: "AwsSolutions-IAM5[Action::s3:GetObject*]",
        reason:
          "CDK BucketDeployment requires wildcard S3 permissions to manage assets, which are managed by CDK and cannot be scoped down.",
      },
      {
        id: "AwsSolutions-IAM5[Action::s3:List*]",
        reason:
          "CDK BucketDeployment requires wildcard S3 permissions to manage assets, which are managed by CDK and cannot be scoped down.",
      },
      {
        id: "AwsSolutions-IAM5[Action::s3:Abort*]",
        reason:
          "CDK BucketDeployment requires wildcard S3 permissions to manage assets, which are managed by CDK and cannot be scoped down.",
      },
      {
        id: "AwsSolutions-IAM5[Action::s3:DeleteObject*]",
        reason:
          "CDK BucketDeployment requires wildcard S3 permissions to manage assets, which are managed by CDK and cannot be scoped down.",
      },
      {
        id: "AwsSolutions-IAM5[Resource::<StorageBucket13B7643F.Arn>/*]",
        reason:
          "CDK BucketDeployment requires wildcard S3 permissions to manage assets, which are managed by CDK and cannot be scoped down.",
      },
    );

    // The IAM5 finding for the CDK assets bucket references an S3 ARN
    // (arn:aws:s3:::...), which also contains multiple "::" and hits the same
    // Validations.acknowledge() limitation (cdklabs/cdk-nag#2351).
    bucketDeployment.node.addMetadata(cdk.Validations.ACKNOWLEDGED_RULES_METADATA_KEY, {
      // cspell:disable-next-line
      [`AwsSolutions-IAM5[Resource::arn:aws:s3:::cdk-hnb659fds-assets-${AWS_MAIN_ACCOUNT_ID}-ap-northeast-1/*]`]:
        "CDK BucketDeployment requires wildcard S3 permissions to manage assets, which are managed by CDK and cannot be scoped down.",
    });
  }
}
