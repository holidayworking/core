import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { PublicHostedZone } from "aws-cdk-lib/aws-route53";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface AcmStackProps extends cdk.StackProps {
  readonly hostedZoneId: string;
  readonly zoneName: string;
}

export class AcmStack extends cdk.Stack {
  public readonly certificate: Certificate;

  constructor(scope: Construct, id: string, props: AcmStackProps) {
    super(scope, id, props);

    const { hostedZoneId, zoneName } = props;

    const zone = PublicHostedZone.fromPublicHostedZoneAttributes(this, "Zone", {
      hostedZoneId,
      zoneName,
    });

    this.certificate = new Certificate(this, "Certificate", {
      domainName: `radicast.${zone.name}`,
      validation: CertificateValidation.fromDns(zone),
    });
  }
}
