import type { Objectish, Path, TrimmedPath } from '../type';
import type { Base } from './base';
import { trimPath } from '../utils';

export interface SubTrait {
  readonly path: TrimmedPath;

  readonly isSub: boolean;
}

export function implementSubTrait(Cls: typeof Base): any {
  return class<T extends Objectish> extends Cls<T> implements SubTrait {
    private super!: this;

    public path: TrimmedPath = [];
    public isSub = false;

    // implicit implements

    sub(relativePath: Path) {
      return Object.assign(Object.create(this), {
        super: this,
        path: trimPath(relativePath),
        isSub: true,
        value(path) {
          return this.super.value(this.path.concat(trimPath(path)));
        },
        observe(listenPath) {
          return this.super.observe(this.path.concat(trimPath(listenPath)));
        },
        commit(recipe, targetPath) {
          this.super.commit(recipe, this.path.concat(trimPath(targetPath)));
        },
        async commitAsync(recipe, targetPath) {
          return this.super.commitAsync(
            recipe,
            this.path.concat(trimPath(targetPath))
          );
        },
      });
    }

    sup() {
      if (this.isSub) {
        return this.super;
      }
      return;
    }

    root() {
      if (this.isSub) {
        return this.super.root();
      }
      return this;
    }
  };
}
