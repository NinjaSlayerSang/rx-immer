export class Wrapper<T> {
  private get: () => T;
  private set: (value: T) => void;

  constructor(get: () => T, set: (value: T) => void) {
    this.get = get;
    this.set = set;
  }

  public get value(): T {
    return this.get();
  }

  public set value(value: T) {
    this.set(value);
  }
}
