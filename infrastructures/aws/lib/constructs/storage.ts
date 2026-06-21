import { ScopedAws, Validations } from "aws-cdk-lib";
import { AnyPrincipal, Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Bucket, CfnBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class Storage extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const { accountId, region } = new ScopedAws(this);

    const cfnCloudfrontAccessLogsBucket = new CfnBucket(this, "CloudfrontAccessLogsBucket", {
      bucketName: `cloudfront-access-logs-${accountId}-${region}-an`,
      bucketNamespace: "account-regional",
      lifecycleConfiguration: {
        rules: [
          {
            status: "Enabled",
            expirationInDays: 400,
          },
        ],
      },
    });

    const cloudfrontAccessLogsBucket = Bucket.fromCfnBucket(cfnCloudfrontAccessLogsBucket);

    cloudfrontAccessLogsBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:*"],
        conditions: {
          Bool: {
            "aws:SecureTransport": "false",
          },
        },
        effect: Effect.DENY,
        principals: [new AnyPrincipal()],
        resources: [
          cloudfrontAccessLogsBucket.bucketArn,
          cloudfrontAccessLogsBucket.arnForObjects("*"),
        ],
      }),
    );

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

    Validations.of(cfnCloudfrontAccessLogsBucket).acknowledge({
      id: "AwsSolutions-S1",
      reason: "Access logs are not required.",
    });
  }
}
