import type { Objectish, Path, Plugin } from '../type';
import { Base, IBase } from './base';
import { implementPluginTrait, PluginTrait } from './plugin-trait';
import { implementSubTrait, SubTrait } from './sub-trait';
import { presetPlugins, PresetPluginsExt } from '../plugins/const';

type IPlain<T, E> = IBase<T> & PluginTrait & SubTrait & E;

type ISub<C, E, S = void, R = C> = {
  sub<T = any>(relativePath: Path): ISub<IPlain<T, E>, E, ISub<C, E, S, R>, R>;

  sup(): S;

  root(): ISub<R, E>;
} & C;

export type RxImmer<T extends Objectish = any, E extends {} = {}> = ISub<
  IPlain<T, PresetPluginsExt<T> & E>,
  PresetPluginsExt<T> & E
>;

export type RxImmerConstructor<T extends Objectish = any, E extends {} = {}> = {
  new (initial: T): RxImmer<T, E>;
};

export function factory<T extends Objectish = any, E extends {} = {}>(
  plugins: Plugin[] = []
): RxImmerConstructor<T, E> {
  const mergedPlugins = presetPlugins.concat(plugins);

  return mergedPlugins.reduce(
    (Cls, plugin) => plugin.generate?.(Cls) ?? Cls,
    implementSubTrait(implementPluginTrait(Base, mergedPlugins))
  );
}

export function create<T extends Objectish, E extends {} = {}>(
  initial: T,
  plugins: Plugin[] = []
): RxImmer<T, E> {
  return new (factory<T, E>(plugins))(initial);
}
