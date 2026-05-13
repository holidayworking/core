import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import { Storage } from "./constructs/storage.ts";

export class RadicastStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Storage(this, "Storage");
  }
}
