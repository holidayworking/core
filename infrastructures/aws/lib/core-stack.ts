import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { Computing } from "./constructs/computing.ts";
import { Log } from "./constructs/log.ts";
import { Monitoring } from "./constructs/monitoring.ts";
import { Network } from "./constructs/network.ts";

export class CoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const log = new Log(this, "Log");

    const network = new Network(this, "Network", {
      flowLogsBucket: log.vpcFlowLogsBucket,
    });

    new Computing(this, "Computing", {
      vpc: network.vpc,
    });

    new Monitoring(this, "Monitoring");
  }
}
