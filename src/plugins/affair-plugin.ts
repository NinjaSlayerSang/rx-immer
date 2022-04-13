import { combineLatest, debounceTime, from, switchMap } from 'rxjs';

import type { Path } from '../type';
import type { RxImmer } from '../core';
import type { Base } from '../core/base';

type AffairKey = number | string;

type Dispose<S> = (this: S, self: S) => void;

type Effect<S> = (this: S, self: S) => Dispose<S>;

interface AffairToken<S> {
  key: AffairKey;
  dispose: Dispose<S>;
}

export interface AffairPluginExt {
  startAffair(effect: Effect<this>, key?: AffairKey): AffairKey;

  stopAffair(key: AffairKey): boolean;

  hasAffair(key: AffairKey): boolean;

  showAffairs(): AffairKey[];
}

export default {
  name: 'affair-plugin',
  generate(Cls: typeof Base): any {
    return class<T> extends Cls<T> implements AffairPluginExt {
      private affairs: Record<AffairKey, AffairToken<this>> = {};
      private defaultAffairKey = 0;

      // inherit

      destroy() {
        Object.values(this.affairs).forEach((token) => {
          token.dispose.call(this, this);
        });
        this.affairs = {};

        super.destroy();
      }

      // private

      private getAffairKey() {
        this.defaultAffairKey += 1;
        return this.defaultAffairKey;
      }

      // implements

      public startAffair(
        effect: Effect<this>,
        key: AffairKey = this.getAffairKey()
      ) {
        this.stopAffair(key);

        const dispose = effect.call(this, this);
        this.affairs[key] = { key, dispose };
        return key;
      }

      public stopAffair(key: AffairKey): boolean {
        if (this.affairs[key]) {
          this.affairs[key].dispose.call(this, this);
          delete this.affairs[key];
          return true;
        }
        return false;
      }

      public hasAffair(key: AffairKey): boolean {
        return !!this.affairs[key];
      }

      public showAffairs() {
        return Object.keys(this.affairs);
      }
    };
  },
};

export function createPromiseEffect<S extends RxImmer>(
  effect: (params: any[]) => Promise<any>,
  originPath: Path[],
  targetPath: Path,
  options?: Partial<{ denounceTime: number }>
): Effect<S> {
  return (self) => {
    const subscription = combineLatest(originPath.map((op) => self.observe(op)))
      .pipe(
        debounceTime(options?.denounceTime ?? 0),
        switchMap((params) => from(effect(params)))
      )
      .subscribe((result) => {
        self.setValue(result, targetPath);
      });
    return () => {
      subscription.unsubscribe();
    };
  };
}
