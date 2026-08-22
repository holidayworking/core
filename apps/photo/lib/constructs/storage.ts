import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import type { IBucket } from "aws-cdk-lib/aws-s3";

import { ScopedAws, Validations } from "aws-cdk-lib";
import {
  Distribution,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket, BucketNamespace } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

type Props = {
  readonly certificate: ICertificate;
  readonly hostedZoneId: string;
  readonly zoneName: string;
};

export class Storage extends Construct {
  public readonly distribution: IDistribution;
  public readonly distributionLogsBucket: IBucket;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { accountId, region } = new ScopedAws(this);

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

    const zone = PublicHostedZone.fromPublicHostedZoneAttributes(this, "Zone", {
      hostedZoneId,
      zoneName,
    });

    this.distribution = new Distribution(this, "Distribution", {
      certificate,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
      },
      defaultRootObject: "index.html",
      domainNames: [`photo.${zone.name}`],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    this.distributionLogsBucket = Bucket.fromBucketAttributes(this, "DistributionLogsBucket", {
      bucketName: `cloudfront-access-logs-${accountId}-${region}-an`,
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
