import type { Objectish, Path, Plugin } from '../type';
import { Base, IBase } from './_base';
import { generateSub, ISub } from './_sub';

export type Plain<T, E = {}> = IBase<T> & ISub & E;

type Sub<C, S = void, R = C> = {
  sub<T = any>(relativePath: Path): Sub<Plain<T>, Sub<C, S, R>, R>;

  sup(): S;

  root(): Sub<R>;
} & C;

export type RxImmer<T extends Objectish> = Sub<Plain<T>>;

export interface Constructable<T extends Objectish> {
  new (initial: T): RxImmer<T>;
}

export function factory<T extends Objectish>(
  plugins: Plugin[]
): Constructable<T> {
  const Cls = plugins.reduce(
    (cls, plugin) => plugin.generate(cls),
    generateSub(Base)
  );

  return Cls;
}

export function create<T extends Objectish>(initial: T, plugins: Plugin[]) {
  return new (factory<T>(plugins))(initial);
}
