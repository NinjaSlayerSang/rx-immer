import { BehaviorSubject } from 'rxjs';
import { applyPatches, castImmutable, Immutable } from 'immer';

import type { RxImmerBase } from './RxImmerBase';
import type { Objectish, PatchesTuple } from '../type';

export interface Flow {
  uid: number;
  timeStamp: number;
  patchesTuple: PatchesTuple;
}

export interface Diachrony<T extends Objectish> {
  anchor: Immutable<T>;
  anchorTimeStamp: number;
  flows: Flow[];
  destination: Immutable<T>;
  archiveTimeStamp: number;
}

export interface IWithDiachrony<T extends Objectish> {
  size$: BehaviorSubject<number>;

  size(): number;

  archive(): Diachrony<T>;
}

export function generateWithDiachrony(Cls: typeof RxImmerBase): any {
  return class RxImmerWithDiachrony<T extends Objectish>
    extends Cls<T>
    implements IWithDiachrony<T>
  {
    private uuid = -1;
    private anchor: Immutable<T>;
    private anchorTimeStamp: number;
    private flows: Flow[] = [];

    public size$ = new BehaviorSubject<number>(0);

    constructor(initial: T) {
      super(initial);

      this.anchor = castImmutable(initial);
      this.anchorTimeStamp = Date.now();

      this.patchesTuple$.subscribe((patchesTuple) => {
        this.appendFlow(patchesTuple);
      });
    }

    // inherit
    destroy() {
      super.destroy();

      this.size$.complete();
    }

    // private
    private appendFlow(patchesTuple: PatchesTuple) {
      this.flows.push({
        uid: this.getUuid(),
        timeStamp: Date.now(),
        patchesTuple,
      });
      this.size$.next(this.size());
    }

    private getUuid() {
      this.uuid += 1;
      return this.uuid;
    }

    // implements
    public size() {
      return this.flows.length;
    }

    public archive(): Diachrony<T> {
      let destination = this.anchor;
      this.flows.forEach((flow) => {
        destination = applyPatches(destination, flow.patchesTuple[0]);
      });

      const diachrony: Diachrony<T> = {
        anchor: this.anchor,
        anchorTimeStamp: this.anchorTimeStamp,
        flows: this.flows,
        destination,
        archiveTimeStamp: Date.now(),
      };

      this.anchor = destination;
      this.anchorTimeStamp = Date.now();
      this.flows = [];
      this.size$.next(0);

      return diachrony;
    }
  };
}
