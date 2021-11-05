import type { Base } from './Base';

export type AffairKey = number | string;

type Dispose = () => void;

interface AffairToken {
  key: AffairKey;
  dispose: Dispose;
}

export interface IFacility {
  startAffair(effect: () => Dispose, key?: AffairKey): AffairKey;

  stopAffair(mark: AffairKey): boolean;

  showAffairs(): AffairKey[];
}

export function generateFacility(Cls: typeof Base): any {
  return class<T> extends Cls<T> implements IFacility {
    private affairs: Record<AffairKey, AffairToken> = {};
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
      effect: () => Dispose,
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

    public showAffairs() {
      return Object.keys(this.affairs);
    }
  };
}
