# MutexList

Create a managed object collection backed by a node `Buffer` and share the data across threads.

## Usage

```ts
import { MutexList } from "mutex-list";

const OBJECT_COUNT = 10000;
const OBJECT_SIZE = 30; // bytes

let list = new MutexList(
  OBJECT_COUNT,
  OBJECT_SIZE,
);

// this is the critical area SharedArrayBuffer
const criticalBuffer = list.criticalBuffer;
// this is the data SharedArrayBuffer
const dataBuffer = list.dataBuffer;

worker.postMessage({ criticalBuffer, dataBuffer });
```

Inside a Worker, do the following things:

```ts
const OBJECT_COUNT = 10000;
const OBJECT_SIZE = 30; // bytes

let list;
parentPort.on("message", (data) => {
  list = new MutexList(
    OBJECT_COUNT,
    OBJECT_SIZE,
    data.criticalBuffer,
    data.dataBuffer,
  );

  // lock a record by it's index. This locks the thread synchronously using Atomic.wait()
  const buffer: Buffer = list.lock(index);

  // do something with buffer
  buffer.fill(255);

  // free the record in the list
  list.unlock(index);
});
```

## API

### constructor

The constructor creates a mutex list

```ts
constructor(
  count?: number, // The number of records in the mutex list
  size?: number, // how many bytes per record
  criticalBuffer?: SharedArrayBuffer, // the critical section buffer
  dataBuffer?: SharedArrayBuffer, // the data section buffer
);
```

### lock

Lock a record by it's index. This method stops the current thread from executing synchronously using `Atomic.wait()` and `Atomic.compareExchange()`. This method returns a node `Buffer` object once the record is locked.

```ts
class MutexList {
  lock(index: number): Buffer;
}
```

### unlock

Unlock a record by it's index. This method notifies a single thread that has called `lock()`, and frees the record using `Atomic.notify()` and `Atomic.compareExchange()`. This method returns `void`.

```ts
class MutexList {
  unlock(index: number): void;
}
```

