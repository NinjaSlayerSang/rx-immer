import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { applyPatches } from 'immer';

import type { Base } from './Base';
import type { HistoryConfig, PatchesTuple, PatchesTupleGroup } from '../type';
import { bufferDebounceTime, reversePatchesTuple } from '../utils';

export interface IWithHistory {
  withHistory: true;

  roamStatus$: BehaviorSubject<[number, number]>;

  setHistoryConfig(config: Partial<HistoryConfig>): HistoryConfig;

  getRoamStatus(): [number, number];

  revert(): void;

  recover(): void;

  reset(): void;
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
    private recordSubscription: Subscription;

    public withHistory: true = true;

    public roamStatus$ = new BehaviorSubject<[number, number]>([0, 0]);

    constructor(initial: T) {
      super(initial);

      this.recordSubscription = this.subscribeRecord();
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

    private subscribeRecord() {
      return this.historyBufferPool$
        .pipe(bufferDebounceTime(this.historyBufferDebounce))
        .subscribe((records) => {
          this.record(records);
        });
    }

    // implements

    public setHistoryConfig(config: Partial<HistoryConfig>): HistoryConfig {
      if (config.capacity !== undefined) {
        this.historyCapacity = config.capacity;
      }

      if (config.bufferDebounce !== undefined) {
        this.historyBufferDebounce = config.bufferDebounce;

        this.recordSubscription.unsubscribe();
        this.recordSubscription = this.subscribeRecord();
      }

      return {
        capacity: this.historyCapacity,
        bufferDebounce: this.historyBufferDebounce,
      };
    }

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
          return _;
        });
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

    public reset() {
      this.history = [];
      this.recycle = [];

      this.onRoamStatusChange();
    }
  };
}
