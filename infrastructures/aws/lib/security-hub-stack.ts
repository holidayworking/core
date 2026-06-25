import * as cdk from "aws-cdk-lib";
import {
  CfnConfigurationPolicy,
  CfnFindingAggregator,
  CfnOrganizationConfiguration,
  CfnPolicyAssociation,
} from "aws-cdk-lib/aws-securityhub";
import { Construct } from "constructs";

export class SecurityHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new CfnFindingAggregator(this, "FindingAggregator", {
      regionLinkingMode: "SPECIFIED_REGIONS",
      regions: ["us-east-1"],
    });

    new CfnOrganizationConfiguration(this, "OrganizationConfiguration", {
      autoEnable: false,
      autoEnableStandards: "NONE",
      configurationType: "CENTRAL",
    });

    const policy = new CfnConfigurationPolicy(this, "ConfigurationPolicy", {
      name: "configuration-policy-01",
      configurationPolicy: {
        securityHub: {
          enabledStandardIdentifiers: [
            "arn:aws:securityhub:ap-northeast-1::standards/aws-foundational-security-best-practices/v/1.0.0",
            "arn:aws:securityhub:ap-northeast-1::standards/cis-aws-foundations-benchmark/v/5.0.0",
          ],
          securityControlsConfiguration: {
            disabledSecurityControlIdentifiers: [],
          },
          serviceEnabled: true,
        },
      },
    });

    new CfnPolicyAssociation(this, "PolicyAssociation", {
      configurationPolicyId: policy.attrId,
      targetId: "r-erco", // cspell:disable-line
      targetType: "ROOT",
    });
  }
}
