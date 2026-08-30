import { expect } from "vite-plus/test";

import type { Result } from "./index.ts";

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
