import { defaultsDeep } from 'lodash';

import type { Config, DeepPartial, Objectish } from '../type';
import { Base, IBase } from './Base';
import { generateFacility, IFacility } from './Facility';
import { generateWithHistory, IWithHistory } from './WithHistory';
import { generateWithDiachrony, IWithDiachrony } from './WithDiachrony';
import { generateReplayMode, IReplayMode } from './ReplayMode';
import { DEFAULT_CONFIG } from '../const';

export type { Diachrony } from './WithDiachrony';

interface IConfig {
  readonly config: Config;
}

export type RxImmer<T extends Objectish> = IBase<T> &
  IConfig &
  IFacility &
  Partial<IWithHistory> &
  Partial<IWithDiachrony<T>> &
  Partial<IReplayMode<T>>;

export interface Constructable<T extends Objectish> {
  new (initial: T): RxImmer<T>;
}

export function factory<T extends Objectish>(config?: DeepPartial<Config>) {
  const finalConfig: Config = defaultsDeep({}, config, DEFAULT_CONFIG);

  let Cls: any = class extends Base<T> implements IConfig {
    public readonly config: Config = finalConfig;
  };

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

  return Cls as Constructable<T>;
}

export function create<T extends Objectish>(
  initial: T,
  config?: DeepPartial<Config>
) {
  return new (factory<T>(config))(initial);
}
