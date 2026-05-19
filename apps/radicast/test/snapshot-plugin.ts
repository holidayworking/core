import type { SnapshotSerializer } from "vitest";

const assetMatch = /[0-9a-f]{64}\.zip/;

export default {
  test(val: unknown) {
    return typeof val === "string" && assetMatch.exec(val) != null;
  },
  serialize(val: string) {
    return `"${val.replace(assetMatch, "[ASSET ZIP]")}"`;
  },
} satisfies SnapshotSerializer;
