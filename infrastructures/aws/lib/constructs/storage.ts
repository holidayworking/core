import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import type { IHostedZone } from "aws-cdk-lib/aws-route53";

import { Validations } from "aws-cdk-lib";
import {
  Distribution,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket, BucketNamespace } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

type Props = {
  readonly hostedZone: IHostedZone;
  readonly photoCertificate: ICertificate;
};

export class Storage extends Construct {
  public readonly photoDistribution: IDistribution;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { hostedZone, photoCertificate } = props;

    const photoBucket = new Bucket(this, "PhotoBucket", {
      bucketNamePrefix: "photo",
      bucketNamespace: BucketNamespace.ACCOUNT_REGIONAL,
      enforceSSL: true,
      versioned: true,
    });

    Validations.of(photoBucket).acknowledge({
      id: "AwsSolutions::AwsSolutions-S1",
      reason: "Access logs are not required.",
    });

    this.photoDistribution = new Distribution(this, "PhotoDistribution", {
      certificate: photoCertificate,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(photoBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
      },
      defaultRootObject: "index.html",
      domainNames: [`photo.${hostedZone.name}`],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    Validations.of(this.photoDistribution).acknowledge(
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

    new ARecord(this, "PhotoARecord", {
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.photoDistribution)),
      zone: hostedZone,
      recordName: "photo",
    });
  }
}
