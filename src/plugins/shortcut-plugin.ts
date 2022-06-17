import { nothing } from 'immer';

import type { Objectish, Path } from '../type';
import type { Base } from '../core/base';

export interface ShortcutPluginExt {
  setValue(value: any, targetPath?: Path): void;
}

export default {
  name: 'shortcut-plugin',
  generate(Cls: typeof Base): any {
    return class<T extends Objectish>
      extends Cls<T>
      implements ShortcutPluginExt
    {
      setValue(value: any, targetPath?: Path) {
        this.commit(() => (value === undefined ? nothing : value), targetPath);
      }
    };
  },
};
