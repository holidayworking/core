import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import { Monitoring } from "./constructs/monitoring.ts";
import { Storage } from "./constructs/storage.ts";

export class CoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Monitoring(this, "Monitoring");

    new Storage(this, "Storage");
  }
}
