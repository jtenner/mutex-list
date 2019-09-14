export const enum MutexState {
  LOCKED = 1,
  UNLOCKED = 0,
}

export class MutexList {
  public data: Buffer;
  public critical: Int32Array;

  constructor(
    public count: number = 10000,
    public size: number = 10,
    public criticalBuffer: SharedArrayBuffer = new SharedArrayBuffer(count << 2),
    public dataBuffer: SharedArrayBuffer = new SharedArrayBuffer(size * count),
  ) {
    this.critical = new Int32Array(criticalBuffer);
    this.data = Buffer.from(dataBuffer);
  }

  lock(index: number): Buffer {
    while (true) {
      let state = Atomics.compareExchange(this.critical, index, MutexState.UNLOCKED, MutexState.LOCKED);
      if (state === MutexState.UNLOCKED) {
        const pointer = index * this.size;
        return this.data.slice(pointer, pointer + this.size);
      }

      Atomics.wait(this.critical, index, MutexState.LOCKED);
    }
  }

  unlock(index: number): void {
    const state = Atomics.compareExchange(this.critical, index, MutexState.LOCKED, MutexState.UNLOCKED);
    if (state === MutexState.UNLOCKED) {
      throw new Error("Invalid Mutex State.");
    }
    Atomics.notify(this.critical, index, 1);
  }
}
