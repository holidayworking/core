import {
  CloudFrontKeyValueStoreClient,
  GetKeyCommand,
} from "@aws-sdk/client-cloudfront-keyvaluestore";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, expect, test } from "vitest";

import { findBasicAuthenticationCredential } from "../../../lib/constructs/lambda/cloudfront-keyvaluestore.ts";
import { kvsArn } from "./fixtures.ts";
import { expectFailure, expectSuccess } from "./helpers.ts";

const kvsMock = mockClient(CloudFrontKeyValueStoreClient);

beforeEach(() => {
  kvsMock.reset();
});

test("returns the credential stored under the radicast key", async () => {
  kvsMock.on(GetKeyCommand).resolves({ Key: "radicast", Value: "secret" });

  const result = await findBasicAuthenticationCredential(kvsArn);

  expect(expectSuccess(result)).toStrictEqual({ username: "radicast", password: "secret" });
  const calls = kvsMock.commandCalls(GetKeyCommand);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.args[0]?.input).toStrictEqual({
    Key: "radicast",
    KvsARN: kvsArn,
  });
});

test("returns Failure when the value is missing", async () => {
  kvsMock.on(GetKeyCommand).resolves({ Key: "radicast" });

  const result = await findBasicAuthenticationCredential(kvsArn);

  expect(expectFailure(result).message).toBe("basic Authentication credential is not found");
});

test("returns Failure when the request fails", async () => {
  kvsMock.on(GetKeyCommand).rejects(new Error("access denied"));

  const result = await findBasicAuthenticationCredential(kvsArn);

  expect(expectFailure(result).message).toBe("access denied");
});
