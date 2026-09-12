import type { IBucket } from "aws-cdk-lib/aws-s3";

import { Validations } from "aws-cdk-lib";
import {
  FlowLogDestination,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { FckNatInstanceProvider } from "cdk-fck-nat";
import { Construct } from "constructs";

export interface NetworkProps {
  readonly flowLogsBucket: IBucket;
}

export class Network extends Construct {
  readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id);

    const natGatewayProvider = new FckNatInstanceProvider({
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.NANO),
    });

    this.vpc = new Vpc(this, "Vpc", {
      maxAzs: 1,
      natGatewayProvider,
      flowLogs: {
        S3: {
          destination: FlowLogDestination.toS3(props.flowLogsBucket),
        },
      },
    });

    natGatewayProvider.securityGroup.addIngressRule(
      Peer.ipv4(this.vpc.vpcCidrBlock),
      Port.allTraffic(),
    );

    Validations.of(this.vpc).acknowledge(
      {
        id: "AwsSolutions::AwsSolutions-EC23",
        reason: "Ingress is restricted to the VPC CIDR; the rule cannot evaluate the CIDR token.",
      },
      {
        id: "AwsSolutions::AwsSolutions-EC26",
        reason: "The fck-nat AMI does not expose its root volume for encryption configuration.",
      },
      {
        id: "AwsSolutions::AwsSolutions-AS3",
        reason:
          "Scaling notifications are not needed for the single-instance NAT Auto Scaling group.",
      },
      {
        id: "AwsSolutions-IAM5[Resource::*]",
        reason:
          "The fck-nat role attaches its own elastic network interface, which cannot be scoped to a resource.",
      },
    );

    this.vpc.node.addMetadata(Validations.ACKNOWLEDGED_RULES_METADATA_KEY, {
      "AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/AmazonSSMManagedEC2InstanceDefaultPolicy]":
        "The fck-nat instance uses the AWS managed policy for SSM Session Manager access. Set on metadata directly because Validations.acknowledge() rejects rule IDs with multiple '::'.",
    });
  }
}
