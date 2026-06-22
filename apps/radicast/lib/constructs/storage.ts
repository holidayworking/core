import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";

import { ScopedAws, Validations } from "aws-cdk-lib";
import {
  Distribution,
  GeoRestriction,
  type IDistribution,
  KeyValueStore,
  Function,
  FunctionCode,
  FunctionRuntime,
  ViewerProtocolPolicy,
  FunctionEventType,
  type IKeyValueStore,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { ARecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket, CfnBucket, type IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const basicAuthenticationFunctionSourceSource = fs.readFileSync(
  path.join(__dirname, "lambda", "functions", "basic-authentication", "index.js"),
  {
    encoding: "utf-8",
  },
);

type Props = {
  readonly certificate: ICertificate;
  readonly hostedZoneId: string;
  readonly zoneName: string;
};

export class Storage extends Construct {
  public readonly bucket: IBucket;
  public readonly distribution: IDistribution;
  public readonly distributionLogsBucket: IBucket;
  public readonly basicAuthenticationCredentialKeyValueStore: IKeyValueStore;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { accountId, region } = new ScopedAws(this);

    const { certificate, hostedZoneId, zoneName } = props;

    const cfnBucket = new CfnBucket(this, "Bucket", {
      bucketName: `radicast-${accountId}-${region}-an`,
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
    });

    this.bucket = Bucket.fromCfnBucket(cfnBucket);

    this.bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:*"],
        conditions: {
          Bool: {
            "aws:SecureTransport": "false",
          },
        },
        effect: Effect.DENY,
        principals: [new AnyPrincipal()],
        resources: [this.bucket.bucketArn, this.bucket.arnForObjects("*")],
      }),
    );

    Validations.of(cfnBucket).acknowledge({
      id: "AwsSolutions-S1",
      reason: "Access logs are not required.",
    });

    const zone = PublicHostedZone.fromPublicHostedZoneAttributes(this, "Zone", {
      hostedZoneId,
      zoneName,
    });

    this.basicAuthenticationCredentialKeyValueStore = new KeyValueStore(
      this,
      "BasicAuthenticationCredentialKeyValueStore",
    );

    const basicAuthenticationFunction = new Function(this, "BasicAuthenticationFunction", {
      code: FunctionCode.fromInline(
        basicAuthenticationFunctionSourceSource.replace(
          "KVS_ID",
          this.basicAuthenticationCredentialKeyValueStore.keyValueStoreId,
        ),
      ),
      keyValueStore: this.basicAuthenticationCredentialKeyValueStore,
      runtime: FunctionRuntime.JS_2_0,
    });

    this.distribution = new Distribution(this, "Distribution", {
      certificate,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(this.bucket),
        functionAssociations: [
          {
            function: basicAuthenticationFunction,
            eventType: FunctionEventType.VIEWER_REQUEST,
          },
        ],
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
      },
      defaultRootObject: "index.html",
      domainNames: [`radicast.${zone.name}`],
      geoRestriction: GeoRestriction.allowlist("JP"),
    });

    this.distributionLogsBucket = Bucket.fromBucketAttributes(this, "DistributionLogsBucket", {
      bucketName: `cloudfront-access-logs-${accountId}-${region}-an`,
    });

    new ARecord(this, "DistributionAliasRecord", {
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      zone,
      recordName: "radicast",
    });

    Validations.of(this.distribution).acknowledge(
      {
        id: "AwsSolutions-CFR2",
        reason: "AWS WAF is not required for static file distribution.",
      },
      {
        id: "AwsSolutions-CFR3",
        reason:
          "Access logs are configured with Standard logging (v2), which cdk-nag does not support yet.",
      },
    );
  }
}
