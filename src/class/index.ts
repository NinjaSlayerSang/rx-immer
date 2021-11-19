import { defaultsDeep } from 'lodash';

import type { Config, DeepPartial, Objectish, Path } from '../type';
import { Base, IBase } from './Base';
import { generateSub, ISub } from './Sub';
import { generateFacility, IFacility } from './Facility';
import { generateWithHistory, IWithHistory } from './WithHistory';
import { generateWithDiachrony, IWithDiachrony } from './WithDiachrony';
import { generateReplayMode, IReplayMode } from './ReplayMode';
import { DEFAULT_CONFIG } from '../const';

export type { Diachrony } from './WithDiachrony';

export interface IConfig {
  readonly config: Config;
}

export type Plain<T> = IBase<T> &
  IConfig &
  ISub &
  IFacility &
  Partial<IWithHistory> &
  Partial<IWithDiachrony> &
  Partial<IReplayMode>;

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
  config?: DeepPartial<Config>
): Constructable<T> {
  const finalConfig: Config = defaultsDeep({}, config, DEFAULT_CONFIG);

  let Cls: any = class extends Base<T> implements IConfig {
    public readonly config: Config = finalConfig;
  };

  Cls = generateSub(Cls);

  Cls = generateFacility(Cls);

  if (finalConfig.replay) {
    Cls = generateReplayMode(Cls);
    return Cls;
  }

  if (finalConfig.history) {
    Cls = generateWithHistory(Cls, finalConfig.history);
  }

  if (finalConfig.diachrony) {
    Cls = generateWithDiachrony(Cls);
  }

  return Cls;
}

export function create<T extends Objectish>(
  initial: T,
  config?: DeepPartial<Config>
) {
  return new (factory<T>(config))(initial);
}
