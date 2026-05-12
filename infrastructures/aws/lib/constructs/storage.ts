import { Aws, Fn } from "aws-cdk-lib";
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket, CfnBucket } from "aws-cdk-lib/aws-s3";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

export class Storage extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const cloudfrontAccessLogsBucket = Bucket.fromCfnBucket(
      new CfnBucket(this, "CloudfrontAccessLogsBucket", {
        bucketName: Fn.join("", [
          "cloudfront-access-logs-",
          Aws.ACCOUNT_ID,
          "-",
          Aws.REGION,
          "-an",
        ]),
        bucketNamespace: "account-regional",
        lifecycleConfiguration: {
          rules: [
            {
              status: "Enabled",
              expirationInDays: 400,
            },
          ],
        },
      }),
    );

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
          `${cloudfrontAccessLogsBucket.bucketArn}/*`,
        ],
      }),
    );

    NagSuppressions.addResourceSuppressions(cloudfrontAccessLogsBucket, [
      { id: "AwsSolutions-S1", reason: "Access logs are not required." },
    ]);
  }
}
