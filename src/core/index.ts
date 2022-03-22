import type { Objectish, Path, Plugin } from '../type';
import { Base, IBase } from './base';
import { implementPluginTrait, PluginTrait } from './plugin-trait';
import { implementSubTrait, SubTrait } from './sub-trait';
import { PresetPluginsExt, presetPlugins } from '../plugins';

type IPlain<T, E> = IBase<T> & PluginTrait & SubTrait & E;

type ISub<C, E, S = void, R = C> = {
  sub<T = any>(relativePath: Path): ISub<IPlain<T, E>, E, ISub<C, E, S, R>, R>;

  sup(): S;

  root(): ISub<R, E>;
} & C;

export type RxImmer<T extends Objectish = any, E extends {} = {}> = ISub<
  IPlain<T, PresetPluginsExt & E>,
  PresetPluginsExt & E
>;

export type RxImmerConstructor<T extends Objectish = any, E extends {} = {}> = {
  new (initial: T): RxImmer<T, E>;
};

export function factory<T extends Objectish = any, E extends {} = {}>(
  plugins: Plugin[] = []
): RxImmerConstructor<T, E> {
  return presetPlugins
    .concat(plugins)
    .reduce(
      (Cls, plugin) => plugin.generate?.(Cls) ?? Cls,
      implementSubTrait(implementPluginTrait(Base))
    );
}

export function create<T extends Objectish, E extends {} = {}>(
  initial: T,
  plugins: Plugin[] = []
) {
  const instance = new (factory<T, E>(plugins))(initial);

  plugins.forEach((plugin) => {
    instance.plugins.push({
      name: plugin.name,
      runtime: plugin.runtime?.(instance),
    });
  });

  return instance;
}
