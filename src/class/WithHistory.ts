import { BehaviorSubject, buffer, debounceTime, Subject } from 'rxjs';
import { applyPatches } from 'immer';

import type { Base } from './Base';
import type { HistoryConfig, PatchesTuple, PatchesTupleGroup } from '../type';
import { reversePatchesTuple } from '../utils';

export interface IWithHistory {
  withHistory: true;

  roamStatus$: BehaviorSubject<[number, number]>;

  getRoamStatus(): [number, number];

  revert(): void;

  recover(): void;
}

export function generateWithHistory(
  Cls: typeof Base,
  config: HistoryConfig
): any {
  return class<T> extends Cls<T> implements IWithHistory {
    private historyCapacity = config.capacity;
    private historyBufferDebounce = config.bufferDebounce;

    private history: PatchesTupleGroup[] = [];
    private recycle: PatchesTupleGroup[] = [];
    private historyBufferPool$ = new Subject<PatchesTuple>();

    public withHistory: true = true;

    public roamStatus$ = new BehaviorSubject<[number, number]>([0, 0]);

    constructor(initial: T) {
      super(initial);

      this.historyBufferPool$
        .pipe(
          buffer(
            this.historyBufferPool$.pipe(
              debounceTime(this.historyBufferDebounce)
            )
          )
        )
        .subscribe((records) => {
          this.record(records);
        });
    }

    // inherit

    onCommit(record: PatchesTuple) {
      super.onCommit(record);

      this.historyBufferPool$.next(record);
    }

    destroy() {
      this.historyBufferPool$.complete();
      this.roamStatus$.complete();

      super.destroy();
    }

    // private

    private onRoamStatusChange() {
      this.roamStatus$.next(this.getRoamStatus());
    }

    private record(records: PatchesTupleGroup) {
      this.history.push(records);
      if (this.history.length > this.historyCapacity) {
        this.history.shift();
      }
      this.recycle = [];

      this.onRoamStatusChange();
    }

    // implements

    public getRoamStatus(): [number, number] {
      return [this.history.length, this.recycle.length];
    }

    public revert() {
      const records = this.history.pop();
      if (records) {
        this.recycle.push(records);
        records.reduceRight((_, record) => {
          this.state = applyPatches(this.state, record[1]);
          this.patchesTuple$.next(reversePatchesTuple(record));
          return undefined;
        }, undefined);
      }

      this.onRoamStatusChange();
    }

    public recover() {
      const records = this.recycle.pop();
      if (records) {
        this.history.push(records);
        records.forEach((record) => {
          this.state = applyPatches(this.state, record[0]);
          this.patchesTuple$.next(record);
        });
      }

      this.onRoamStatusChange();
    }
  };
}
