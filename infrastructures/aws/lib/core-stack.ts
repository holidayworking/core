import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import { Log } from "./constructs/log.ts";
import { Monitoring } from "./constructs/monitoring.ts";

export class CoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Log(this, "Log");

    new Monitoring(this, "Monitoring");
  }
}
