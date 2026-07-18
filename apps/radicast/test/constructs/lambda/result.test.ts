import { expect, test } from "vitest";

import type { Result } from "../../../lib/constructs/lambda/result.ts";

import { Failure, Success } from "../../../lib/constructs/lambda/result.ts";

test("Success holds the value and narrows via isSuccess", () => {
  const result: Result<string, Error> = new Success("value");

  expect(result.isSuccess()).toBe(true);
  expect(result.isFailure()).toBe(false);

  if (result.isFailure()) {
    expect.unreachable();
  }
  expect(result.value).toBe("value");
});

test("Failure holds the error and narrows via isFailure", () => {
  const error = new Error("something went wrong");
  const result: Result<string, Error> = new Failure(error);

  expect(result.isSuccess()).toBe(false);
  expect(result.isFailure()).toBe(true);

  if (result.isSuccess()) {
    expect.unreachable();
  }
  expect(result.error).toBe(error);
});
