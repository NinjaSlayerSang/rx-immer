import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { applyPatches, Immutable } from 'immer';

import type { PatchesTuple, PatchesTupleGroup } from '../type';
import type { Base } from '../core/base';
import { bufferDebounceTime, reversePatchesTuple } from '../utils';

interface HistoryConfig {
  capacity: number;
  bufferDebounce: number;
}

const DEFAULT_CONFIG_HISTORY: HistoryConfig = {
  capacity: Number.POSITIVE_INFINITY,
  bufferDebounce: 0,
};

export interface HistoryPluginExt {
  roamStatus$: BehaviorSubject<[number, number]>;

  setHistoryConfig(config: Partial<HistoryConfig>): HistoryConfig;

  getRoamStatus(): [number, number];

  revert(): void;

  recover(): void;

  reset(): void;
}

export default function (cfg: Partial<HistoryConfig> = {}) {
  const config = { ...DEFAULT_CONFIG_HISTORY, ...cfg };

  return {
    name: 'history-plugin',
    generate(Cls: typeof Base): any {
      return class<T> extends Cls<T> implements HistoryPluginExt {
        private historyCapacity = config.capacity;
        private historyBufferDebounce = config.bufferDebounce;

        private history: PatchesTupleGroup[] = [];
        private recycle: PatchesTupleGroup[] = [];
        private historyBufferPool$ = new Subject<PatchesTuple>();
        private recordSubscription: Subscription;

        public roamStatus$ = new BehaviorSubject<[number, number]>([0, 0]);

        constructor(initial: T) {
          super(initial);

          this.recordSubscription = this.subscribeRecord();
        }

        // inherit

        update(state: Immutable<T>, record: PatchesTuple) {
          super.update(state, record);

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
            Array.from(records)
              .reverse()
              .forEach((record) => {
                this.state = applyPatches(this.state, record[1]);
                this.patchesTuple$.next(reversePatchesTuple(record));
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
    },
  };
}
