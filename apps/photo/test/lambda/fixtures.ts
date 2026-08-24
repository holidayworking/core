import type { APIGatewayProxyEventV2, Context } from "aws-lambda";

export const createContext = () =>
  ({
    awsRequestId: "00000000-0000-0000-0000-000000000000",
    functionName: "photo-test",
    functionVersion: "$LATEST",
    invokedFunctionArn: "arn:aws:lambda:ap-northeast-1:123456789012:function:photo-test",
    memoryLimitInMB: "128",
    getRemainingTimeInMillis: () => 1000,
  }) as unknown as Context;

export const createEvent = (rawPath: string) =>
  ({
    rawPath,
  }) as unknown as APIGatewayProxyEventV2;
