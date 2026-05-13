import { Aws, Fn } from "aws-cdk-lib";
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket, CfnBucket } from "aws-cdk-lib/aws-s3";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

export class Storage extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const bucket = Bucket.fromCfnBucket(
      new CfnBucket(this, "Bucket", {
        bucketName: Fn.join("", ["radicast-", Aws.ACCOUNT_ID, "-", Aws.REGION, "-an"]),
        bucketNamespace: "account-regional",
        lifecycleConfiguration: {
          rules: [
            {
              status: "Enabled",
              expiredObjectDeleteMarker: true,
              noncurrentVersionExpirationInDays: 7,
              transitions: [
                {
                  storageClass: "STANDARD_IA",
                  transitionInDays: 30,
                },
              ],
            },
          ],
        },
        versioningConfiguration: {
          status: "Enabled",
        },
      }),
    );

    bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:*"],
        conditions: {
          Bool: {
            "aws:SecureTransport": "false",
          },
        },
        effect: Effect.DENY,
        principals: [new AnyPrincipal()],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
      }),
    );

    NagSuppressions.addResourceSuppressions(bucket, [
      { id: "AwsSolutions-S1", reason: "Access logs are not required." },
    ]);
  }
}
