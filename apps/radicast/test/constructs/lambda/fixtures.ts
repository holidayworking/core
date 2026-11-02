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

export const createRadiruDefinition = () => ({
  id: "radirer",
  service: "radiru" as const,
  title: "らじらー! サンデー",
  author: "乃木坂46",
  image: "https://img.nhk.jp/static/assets/images/radioseries/rs/88W859PYQ9/eyecatch.jpg",
  seriesSiteId: "88W859PYQ9",
  cornerSiteId: "01",
  programSchedules: ["05 20 * * 0", "05 21 * * 0"],
  executionSchedule: "30 23 ? * 1 *",
});

const createRadiruEpisode = (hour: number, performers: string) => ({
  id: hour,
  program_title: `らじらー! サンデー ${hour}時台 ${performers}`,
  onair_date: `11月1日(日)午後${hour - 12}:05放送`,
  stream_url: `https://vod-stream.nhk.jp/radioondemand/r/88W859PYQ9/s/stream_${hour}/index.m3u8`,
  aa_contents_id: `[radio]vod;らじらー! サンデー ${hour}時台 ${performers};r1,130;20261101723${hour};2026-11-01T${hour}:05:00+09:00_2026-11-01T${hour}:55:00+09:00`,
});

export const createRadiruSeries = () => ({
  id: 9,
  title: "らじらー! サンデー ",
  radio_broadcast: "R1",
  episodes: [
    createRadiruEpisode(20, "川﨑桜 柴田柚菜(乃木坂46)"),
    createRadiruEpisode(21, "川﨑桜 柴田柚菜 弓木奈於(乃木坂46)"),
    createRadiruEpisode(22, "川﨑桜 弓木奈於(乃木坂46)"),
  ],
});
