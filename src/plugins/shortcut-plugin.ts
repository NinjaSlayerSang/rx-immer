import { nothing } from 'immer';

import type { Path } from '../type';
import type { Base } from '../core/base';

export interface ShortcutPluginExt<T> {
  setValue(value: T): void;
  setValue<V>(value: V, targetPath: Path): void;
}

export default {
  name: 'shortcut-plugin',
  generate(Cls: typeof Base): any {
    return class<T> extends Cls<T> implements ShortcutPluginExt<T> {
      setValue(value: any, targetPath?: Path) {
        this.commit(() => (value === undefined ? nothing : value), targetPath);
      }
    };
  },
};
