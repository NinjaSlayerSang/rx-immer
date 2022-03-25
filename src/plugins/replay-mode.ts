import { BehaviorSubject, map, merge } from 'rxjs';
import { applyPatches, castImmutable } from 'immer';
import { range } from 'lodash';

import type { Path } from '../type';
import type { Base } from '../core/base';
import type { Diachrony, Flow } from './diachrony-plugin';
import { getByPath, reversePatchesTuple } from '../utils';

export interface ReplayModeExt {
  timeRange$: BehaviorSubject<[number, number]>;

  setDiachrony(diachrony: Diachrony): void;

  getTimeRange(): [number, number];

  getKeyframes(): number[];

  replay(timeStamp: number): boolean;
}

export default {
  name: 'replay-mode',
  generate(Cls: typeof Base): any {
    return class<T> extends Cls<T> implements ReplayModeExt {
      private initialTimeStamp: number;
      private terminalTimeStamp: number;
      private flows: Flow[] = [];
      private cursor = 0;

      public timeRange$: BehaviorSubject<[number, number]>;

      constructor(initial: T) {
        super(initial);

        this.initialTimeStamp = Date.now();
        this.terminalTimeStamp = Date.now();
        this.timeRange$ = new BehaviorSubject([
          this.initialTimeStamp,
          this.terminalTimeStamp,
        ]);
      }

      // inherit

      observe(listenPath?: Path) {
        const observe = super.observe(listenPath);

        return merge(
          observe,
          this.timeRange$.pipe(map(() => getByPath(this.state, listenPath)))
        );
      }

      commit() {}

      async commitAsync() {}

      destroy() {
        this.timeRange$.complete();

        super.destroy();
      }

      // private

      private shiftRight() {
        const { patchesTuple } = this.flows[this.cursor];
        this.state = applyPatches(this.state, patchesTuple[0]);
        this.patchesTuple$.next(patchesTuple);
        this.cursor += 1;
      }

      private shiftLeft() {
        this.cursor -= 1;
        const { patchesTuple } = this.flows[this.cursor];
        this.state = applyPatches(this.state, patchesTuple[1]);
        this.patchesTuple$.next(reversePatchesTuple(patchesTuple));
      }

      private moveCursor(index: number): boolean {
        if (0 <= index && index <= this.size()) {
          if (this.cursor < index) {
            range(this.cursor - index).forEach(() => {
              this.shiftRight();
            });
            return true;
          }
          if (this.cursor > index) {
            range(this.cursor - index).forEach(() => {
              this.shiftLeft();
            });
            return true;
          }
          return false;
        }
        return false;
      }

      private move(uid?: number): boolean {
        const index = this.flows.findIndex((flow) => flow.uid === uid);
        return this.moveCursor(index + 1);
      }

      private locateWithTimeStamp(timeStamp: number): number | undefined {
        return this.flows.filter((flow) => flow.timeStamp <= timeStamp).pop()
          ?.uid;
      }

      // implements

      public size() {
        return this.flows.length;
      }

      public setDiachrony(diachrony: Diachrony) {
        this.state = castImmutable(diachrony.anchor);
        this.flows = diachrony.flows.sort((a, b) => a.uid - b.uid);
        this.cursor = 0;
        this.initialTimeStamp = diachrony.anchorTimeStamp;
        this.terminalTimeStamp = diachrony.archiveTimeStamp;
        this.timeRange$.next([this.initialTimeStamp, this.terminalTimeStamp]);
      }

      public getTimeRange(): [number, number] {
        return [this.initialTimeStamp, this.terminalTimeStamp];
      }

      public getKeyframes(): number[] {
        return this.flows.map((flow) => flow.timeStamp);
      }

      public replay(timeStamp: number): boolean {
        return this.move(this.locateWithTimeStamp(timeStamp));
      }
    };
  },
};
