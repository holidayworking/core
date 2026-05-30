import {
  CloudFrontKeyValueStoreClient,
  GetKeyCommand,
} from "@aws-sdk/client-cloudfront-keyvaluestore";

import { Failure, Success } from "./result.ts";

export const findBasicAuthenticationCredential = async (kvsArn: string) => {
  try {
    const client = new CloudFrontKeyValueStoreClient({ region: "us-east-1" });
    const command = new GetKeyCommand({
      Key: "radicast",
      KvsARN: kvsArn,
    });
    const response = await client.send(command);
    if (!response.Value) {
      return new Failure(new Error("basic Authentication credential is not found"));
    }
    return new Success({ username: "radicast", password: response.Value });
  } catch (e) {
    if (e instanceof Error) {
      return new Failure(e);
    } else {
      return new Failure(new Error());
    }
  }
};
