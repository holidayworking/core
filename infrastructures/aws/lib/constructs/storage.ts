import { Duration, ScopedAws, Validations } from "aws-cdk-lib";
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Bucket, BucketNamespace } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class Storage extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const { accountId } = new ScopedAws(this);

    const cloudfrontAccessLogsBucket = new Bucket(this, "CloudfrontAccessLogsBucket", {
      bucketNamePrefix: "cloudfront-access-logs",
      bucketNamespace: BucketNamespace.ACCOUNT_REGIONAL,
      enforceSSL: true,
      lifecycleRules: [
        {
          expiration: Duration.days(400),
        },
      ],
    });

    cloudfrontAccessLogsBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:PutObject"],
        conditions: {
          StringEquals: {
            "s3:x-amz-acl": "bucket-owner-full-control",
            "aws:SourceAccount": accountId,
          },
          ArnLike: {
            "aws:SourceArn": `arn:aws:logs:us-east-1:${accountId}:delivery-source:*`,
          },
        },
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal("delivery.logs.amazonaws.com")],
        resources: [`${cloudfrontAccessLogsBucket.bucketArn}/AWSLogs/${accountId}/*`],
      }),
    );

    Validations.of(cloudfrontAccessLogsBucket).acknowledge({
      id: "AwsSolutions::AwsSolutions-S1",
      reason: "Access logs are not required.",
    });
  }
}
