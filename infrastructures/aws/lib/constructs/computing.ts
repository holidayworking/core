import type { IVpc } from "aws-cdk-lib/aws-ec2";

import { Stack, Validations } from "aws-cdk-lib";
import {
  GenericLinuxImage,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  SubnetType,
  UserData,
} from "aws-cdk-lib/aws-ec2";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

type Props = {
  readonly vpc: IVpc;
};

const LEO_TAILSCALE_AUTH_KEY_PARAMETER_NAME = "core/computing/leo/tailscale-auth-key";

export class Computing extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const leoRole = new Role(this, "LeoRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
    });

    leoRole.addToPolicy(
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

    leoRole.addToPolicy(
      new PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          Stack.of(this).formatArn({
            service: "ssm",
            resource: "parameter",
            resourceName: LEO_TAILSCALE_AUTH_KEY_PARAMETER_NAME,
          }),
        ],
      }),
    );

    const leoUserData = UserData.forLinux();
    leoUserData.addCommands(
      `AUTH_KEY=$(sudo -u hidekazu -i aws ssm get-parameter --name /${LEO_TAILSCALE_AUTH_KEY_PARAMETER_NAME} --with-decryption --query "Parameter.Value" --output text)`,
      'sudo tailscale up --auth-key="$AUTH_KEY"',
    );

    const leoInstance = new Instance(this, "LeoInstance", {
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      machineImage: new GenericLinuxImage({ "ap-northeast-1": "ami-087a24522f428a68e" }),
      vpc: props.vpc,
      detailedMonitoring: true,
      disableApiTermination: true,
      requireImdsv2: true,
      role: leoRole,
      userData: leoUserData,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    });

    Validations.of(leoInstance).acknowledge(
      {
        id: "AwsSolutions-IAM5[Resource::*]",
        reason:
          "Session Manager's ssmmessages/ec2messages control- and data-channel actions do not support resource-level scoping.",
      },
      {
        id: "CloudFormation-Validate::W9010",
        reason:
          "This AMI is a custom NixOS image built and uploaded specifically for this instance; it is not meant to be portable across regions or environments.",
      },
    );
  }
}
