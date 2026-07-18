import { Logger } from "@aws-lambda-powertools/logger";
import { expect, vi } from "vitest";

import type { Result } from "../../../lib/constructs/lambda/result.ts";

export const expectSuccess = <T>(result: Result<T, Error>): T => {
  if (result.isFailure()) {
    expect.unreachable();
  }
  return result.value;
};

export const expectFailure = (result: Result<unknown, Error>): Error => {
  if (result.isSuccess()) {
    expect.unreachable();
  }
  return result.error;
};

export const spyOnLoggerError = () =>
  vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});
