import type { Base } from './Base';

export type AffairKey = number | string;

type Dispose<T> = (this: T) => void;

interface AffairToken<T> {
  key: AffairKey;
  dispose: Dispose<T>;
}

export interface IFacility {
  startAffair(
    effect: (this: this) => Dispose<this>,
    key?: AffairKey
  ): AffairKey;

  stopAffair(key: AffairKey): boolean;

  hasAffair(key: AffairKey): boolean;

  showAffairs(): AffairKey[];
}

export function generateFacility(Cls: typeof Base): any {
  return class<T> extends Cls<T> implements IFacility {
    private affairs: Record<AffairKey, AffairToken<this>> = {};
    private defaultAffairKey = 0;

    // inherit

    destroy() {
      Object.values(this.affairs).forEach((token) => {
        token.dispose.call(this);
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
      effect: (this: this) => Dispose<this>,
      key: AffairKey = this.getAffairKey()
    ) {
      this.stopAffair(key);

      const dispose = effect.call(this);
      this.affairs[key] = { key, dispose };
      return key;
    }

    public stopAffair(key: AffairKey): boolean {
      if (this.affairs[key]) {
        this.affairs[key].dispose.call(this);
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
}
