import type { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import type { IBucket } from "aws-cdk-lib/aws-s3";

import { CfnDelivery, CfnDeliveryDestination, CfnDeliverySource } from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface CloudfrontAccessLogStackProps extends cdk.StackProps {
  readonly photoDistribution: IDistribution;
  readonly distributionLogsBucket: IBucket;
}

export class CloudfrontAccessLogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CloudfrontAccessLogStackProps) {
    super(scope, id, props);

    const { photoDistribution, distributionLogsBucket } = props;

    const photoDistributionDeliverySource = new CfnDeliverySource(
      this,
      "PhotoDistributionDeliverySource",
      {
        name: "photo-cloudfront-access-logs-source",
        logType: "ACCESS_LOGS",
        resourceArn: photoDistribution.distributionArn,
      },
    );

    const photoDistributionDeliveryDestination = new CfnDeliveryDestination(
      this,
      "PhotoDistributionDeliveryDestination",
      {
        name: "photo-cloudfront-access-logs-json",
        deliveryDestinationType: "S3",
        destinationResourceArn: distributionLogsBucket.bucketArn,
        outputFormat: "json",
      },
    );

    new CfnDelivery(this, "PhotoDistributionDelivery", {
      deliverySourceName: photoDistributionDeliverySource.ref,
      deliveryDestinationArn: photoDistributionDeliveryDestination.attrArn,
      s3SuffixPath: "AWSLogs/{account-id}/CloudFront/{DistributionId}/{yyyy}/{MM}/{dd}/{HH}",
    });
  }
}
