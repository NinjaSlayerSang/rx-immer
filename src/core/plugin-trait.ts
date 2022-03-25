import type { Base } from './base';

interface PluginEntity {
  name: string;
  runtime: any;
}

export interface PluginTrait {
  readonly plugins: PluginEntity[];
}

export function implementPluginTrait(Cls: typeof Base): any {
  return class<T> extends Cls<T> implements PluginTrait {
    public plugins: PluginEntity[] = [];
  };
}
