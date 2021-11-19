import { get } from 'lodash';

import type { Base } from './Base';
import type { Path, TrimmedPath } from '../type';
import { trimPath } from '../utils';

export interface ISub {
  readonly path: TrimmedPath;

  readonly isSub: boolean;
}

export function generateSub(Cls: typeof Base): any {
  return class<T> extends Cls<T> implements ISub {
    private super!: this;

    public path: TrimmedPath = [];
    public isSub = false;

    // implicit implements

    sub(relativePath: Path) {
      return Object.assign(Object.create(this), {
        super: this,
        path: trimPath(relativePath),
        isSub: true,
        value() {
          return get(this.super.value(), this.path);
        },
        observe(listenPath) {
          return this.super.observe(this.path.concat(listenPath ?? []));
        },
        commit(recipe, targetPath) {
          this.super.commit(recipe, this.path.concat(targetPath ?? []));
        },
        commitValue(recipe, targetPath) {
          this.super.commitValue(recipe, this.path.concat(targetPath));
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
