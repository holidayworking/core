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
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { FckNatInstanceProvider } from "cdk-fck-nat";
import { Construct } from "constructs";

type Props = {
  readonly flowLogsBucket: IBucket;
};

export class Network extends Construct {
  readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const natGatewayProvider = new FckNatInstanceProvider({
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.NANO),
      enableSsm: false,
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

    natGatewayProvider.role.addToPolicy(
      new PolicyStatement({
        actions: [
          "ec2messages:AcknowledgeMessage",
          "ec2messages:DeleteMessage",
          "ec2messages:FailMessage",
          "ec2messages:GetEndpoint",
          "ec2messages:GetMessages",
          "ec2messages:SendReply",
          "ssm:UpdateInstanceInformation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel",
        ],
        resources: ["*"],
      }),
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
          "Session Manager's ssmmessages/ec2messages control- and data-channel actions do not support resource-level scoping; the fck-nat role also attaches its own elastic network interface, which cannot be scoped to a resource.",
      },
    );
  }
}
