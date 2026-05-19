import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import type { IBucket } from "aws-cdk-lib/aws-s3";

import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import { Storage } from "./constructs/storage.ts";

interface RadicastStackProps extends cdk.StackProps {
  readonly certificate: ICertificate;
  readonly hostedZoneId: string;
  readonly zoneName: string;
}

export class RadicastStack extends cdk.Stack {
  public readonly distribution: IDistribution;
  public readonly distributionLogsBucket: IBucket;

  constructor(scope: Construct, id: string, props: RadicastStackProps) {
    super(scope, id, props);

    const { certificate, hostedZoneId, zoneName } = props;

    const { distribution, distributionLogsBucket } = new Storage(this, "Storage", {
      certificate,
      hostedZoneId,
      zoneName,
    });

    this.distribution = distribution;
    this.distributionLogsBucket = distributionLogsBucket;
  }
}
