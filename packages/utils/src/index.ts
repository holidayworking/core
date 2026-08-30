export type Result<T, E extends Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  isSuccess(): this is Success<T> {
    return true;
  }

  isFailure(): this is Failure<Error> {
    return false;
  }
}

export class Failure<E extends Error> {
  constructor(readonly error: E) {}

  isSuccess(): this is Success<unknown> {
    return false;
  }

  isFailure(): this is Failure<E> {
    return true;
  }
}

export type PromiseResult<T, E extends Error> = Promise<Result<T, E>>;

// Normalizes a `catch` clause's `unknown` value into a `Failure<Error>`,
// since values thrown in JavaScript aren't guaranteed to be `Error` instances.
export const toFailure = (e: unknown): Failure<Error> =>
  e instanceof Error ? new Failure(e) : new Failure(new Error());
