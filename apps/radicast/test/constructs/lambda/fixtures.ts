import type { Context, S3Event } from "aws-lambda";

export const kvsArn = "arn:aws:cloudfront::123456789012:key-value-store/radicast";

export const createContext = () =>
  ({
    awsRequestId: "00000000-0000-0000-0000-000000000000",
    functionName: "radicast-test",
    functionVersion: "$LATEST",
    invokedFunctionArn: "arn:aws:lambda:ap-northeast-1:123456789012:function:radicast-test",
    memoryLimitInMB: "128",
    getRemainingTimeInMillis: () => 1000,
  }) as unknown as Context;

export const createS3Event = (...objects: { bucket: string; key: string }[]) =>
  ({
    Records: objects.map(({ bucket, key }) => ({
      s3: {
        bucket: { name: bucket },
        object: { key },
      },
    })),
  }) as unknown as S3Event;

export const createDefinition = () => ({
  id: "yuna78mhz",
  title: "乃木坂46 柴田柚菜のDreaming time",
  author: "柴田柚菜",
  image: "https://program-static.cf.radiko.jp/4shbilswvp.jpg",
  area: "JP13",
  station: "BAYFM78",
  programSchedules: ["00 23 * * 2"],
  executionSchedule: "00 00 ? * 4 *",
});
