import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { IHostedZone } from "aws-cdk-lib/aws-route53";

import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface AcmStackProps extends cdk.StackProps {
  readonly hostedZone: IHostedZone;
}

export class AcmStack extends cdk.Stack {
  public readonly photoCertificate: ICertificate;

  constructor(scope: Construct, id: string, props: AcmStackProps) {
    super(scope, id, props);

    const { hostedZone } = props;

    this.photoCertificate = new Certificate(this, "PhotoCertificate", {
      domainName: `photo.${hostedZone.name}`,
      validation: CertificateValidation.fromDns(hostedZone),
    });
  }
}
