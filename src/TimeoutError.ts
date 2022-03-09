export class TimeoutError<T> extends Error {
  constructor(
    public type: T,
    public timeout: number,
  ) {
    super(`??`);
  }
}
