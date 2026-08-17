import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import type { IHostedZone } from "aws-cdk-lib/aws-route53";
import type { IBucket } from "aws-cdk-lib/aws-s3";

import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import { Log } from "./constructs/log.ts";
import { Monitoring } from "./constructs/monitoring.ts";
import { Storage } from "./constructs/storage.ts";

interface CoreStackProps extends cdk.StackProps {
  readonly hostedZone: IHostedZone;
  readonly photoCertificate: ICertificate;
}

export class CoreStack extends cdk.Stack {
  public readonly photoDistribution: IDistribution;
  public readonly distributionLogsBucket: IBucket;

  constructor(scope: Construct, id: string, props: CoreStackProps) {
    super(scope, id, props);

    const { hostedZone, photoCertificate } = props;

    const log = new Log(this, "Log");

    new Monitoring(this, "Monitoring");

    const storage = new Storage(this, "Storage", { hostedZone, photoCertificate });

    this.photoDistribution = storage.photoDistribution;
    this.distributionLogsBucket = log.cloudfrontAccessLogsBucket;
  }
}
