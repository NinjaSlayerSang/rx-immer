import type { Plugin } from '../type';
import type { Base } from './base';

interface PluginEntity {
  name: string;
  runtime: any;
}

export interface PluginTrait {
  readonly plugins: PluginEntity[];

  pluginRuntime(name: string): any;
}

export function implementPluginTrait(Cls: typeof Base, plugins: Plugin[]): any {
  return class<T> extends Cls<T> implements PluginTrait {
    public plugins: PluginEntity[];

    constructor(initial: T) {
      super(initial);

      this.plugins = plugins.map((plugin) => ({
        name: plugin.name,
        runtime: plugin.runtime?.(this),
      }));
    }

    public pluginRuntime(name: string) {
      return this.plugins.find((plugin) => plugin.name === name)?.runtime;
    }
  };
}
