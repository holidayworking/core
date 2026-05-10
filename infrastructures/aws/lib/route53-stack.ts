import * as cdk from "aws-cdk-lib";
import { PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { ARecord, CnameRecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export class Route53Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, "LogGroup", {
      logGroupName: "/aws/route53/holidayworking.org",
      retention: RetentionDays.ONE_WEEK,
    });

    logGroup.addToResourcePolicy(
      new PolicyStatement({
        actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
        principals: [new ServicePrincipal("route53.amazonaws.com")],
        resources: [logGroup.logGroupArn],
      }),
    );

    const zone = new PublicHostedZone(this, "HostedZone", {
      queryLogsLogGroupArn: logGroup.logGroupArn,
      zoneName: "holidayworking.org",
    });

    const gitHubPagesARecord = new ARecord(this, "GitHubPagesARecord", {
      target: RecordTarget.fromIpAddresses(
        "185.199.108.153",
        "185.199.109.153",
        "185.199.110.153",
        "185.199.111.153",
      ),
      zone,
    });

    new CnameRecord(this, "GitHubPagesCnameRecord", {
      domainName: gitHubPagesARecord.domainName,
      zone,
      recordName: "www",
    });
  }
}
