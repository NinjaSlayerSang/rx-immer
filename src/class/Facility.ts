import type { Base } from './Base';

type AffairKey = number | string;

type Dispose = () => void;

export interface AffairToken {
  key: AffairKey;
  dispose: Dispose;
}

export interface IFacility {
  startAffair(effect: () => Dispose, key?: AffairKey): AffairToken;

  stopAffair(mark: AffairToken | AffairKey): boolean;

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
    ): AffairToken {
      this.affairs[key]?.dispose.call(this);

      const dispose = effect.call(this);
      const token: AffairToken = { key, dispose };
      this.affairs[key] = token;
      return token;
    }

    public stopAffair(mark: AffairToken | AffairKey): boolean {
      if (typeof mark === 'object') {
        const { key } = mark;
        if (this.affairs[key]) {
          mark.dispose.call(this);
          delete this.affairs[key];
          return true;
        }
        return false;
      }

      if (this.affairs[mark]) {
        this.affairs[mark].dispose.call(this);
        delete this.affairs[mark];
        return true;
      }
      return false;
    }

    public showAffairs() {
      return Object.keys(this.affairs);
    }
  };
}
