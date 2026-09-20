import type { IVpc } from "aws-cdk-lib/aws-ec2";

import { Stack, Validations } from "aws-cdk-lib";
import {
  BlockDeviceVolume,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  SubnetType,
  UserData,
} from "aws-cdk-lib/aws-ec2";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

type Props = {
  readonly vpc: IVpc;
};

export class Computing extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const cancerRole = new Role(this, "CancerRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
    });

    cancerRole.addToPolicy(
      new PolicyStatement({
        actions: [
          "cloudwatch:PutMetricData",
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

    cancerRole.addToPolicy(
      new PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          Stack.of(this).formatArn({
            service: "ssm",
            resource: "parameter",
            resourceName: "core/computing/cancer/tailscale-auth-key",
          }),
        ],
      }),
    );

    Validations.of(cancerRole).acknowledge({
      id: "AwsSolutions-IAM5[Resource::*]",
      reason:
        "Session Manager's ssmmessages/ec2messages control- and data-channel actions do not support resource-level scoping, and CloudWatch's PutMetricData API does not support resource-level scoping either.",
    });

    const cancerUserData = UserData.forLinux();
    cancerUserData.addCommands(
      `AUTH_KEY=$(sudo -u hidekazu -i aws ssm get-parameter --name /core/computing/cancer/tailscale-auth-key --with-decryption --query "Parameter.Value" --output text)`,
      'sudo tailscale up --auth-key="$AUTH_KEY"',
    );

    const cancerInstance = new Instance(this, "CancerInstance", {
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.SMALL),
      machineImage: MachineImage.fromSsmParameter("/core/computing/cancer/ami-id"),
      vpc: props.vpc,
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: BlockDeviceVolume.ebs(20),
        },
      ],
      detailedMonitoring: true,
      disableApiTermination: true,
      requireImdsv2: true,
      role: cancerRole,
      userData: cancerUserData,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    });

    Validations.of(cancerInstance).acknowledge({
      id: "CloudFormation-Validate::W9010",
      reason:
        "This AMI is a custom NixOS image built and uploaded specifically for this instance; it is not meant to be portable across regions or environments.",
    });
  }
}
