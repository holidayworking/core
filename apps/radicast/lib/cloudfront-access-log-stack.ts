import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import type { IBucket } from "aws-cdk-lib/aws-s3";

import { CfnDelivery, CfnDeliveryDestination, CfnDeliverySource } from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface CloudfrontAccessLogStackProps extends cdk.StackProps {
  readonly distribution: IDistribution;
  readonly distributionLogsBucket: IBucket;
}

export class CloudfrontAccessLogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CloudfrontAccessLogStackProps) {
    super(scope, id, props);

    const { distribution, distributionLogsBucket } = props;

    const distributionDeliverySource = new CfnDeliverySource(this, "DistributionDeliverySource", {
      name: "radicast-cloudfront-access-logs-source",
      logType: "ACCESS_LOGS",
      resourceArn: distribution.distributionArn,
    });

    const distributionDeliveryDestination = new CfnDeliveryDestination(
      this,
      "DistributionDeliveryDestination",
      {
        name: "radicast-cloudfront-access-logs-json",
        deliveryDestinationType: "S3",
        destinationResourceArn: distributionLogsBucket.bucketArn,
        outputFormat: "json",
      },
    );

    new CfnDelivery(this, "DistributionDelivery", {
      deliverySourceName: distributionDeliverySource.ref,
      deliveryDestinationArn: distributionDeliveryDestination.attrArn,
      s3SuffixPath: "AWSLogs/{account-id}/CloudFront/{DistributionId}/{yyyy}/{MM}/{dd}/{HH}",
    });
  }
}
