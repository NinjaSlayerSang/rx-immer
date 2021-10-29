import { defaultsDeep } from 'lodash';

import type { Config, DeepPartial, Objectish } from '../type';
import { IRxImmerBase, RxImmerBase } from './RxImmerBase';
import { generateWithHistory, IWithHistory } from './RxImmerWithHistory';
import { generateWithDiachrony, IWithDiachrony } from './RxImmerWithDiachrony';
import { generateReplayMode, IReplayMode } from './RxImmerReplayMode';
import { DEFAULT_CONFIG } from '../const';

export type { Diachrony } from './RxImmerWithDiachrony';

export type RxImmer<T extends Objectish> = IRxImmerBase<T> &
  Partial<IWithHistory> &
  Partial<IWithDiachrony<T>> &
  Partial<IReplayMode<T>>;

interface RxImmerConstructable<T extends Objectish> {
  new (initial: T): RxImmer<T>;
}

export function factory<T extends Objectish>(config?: DeepPartial<Config>) {
  const finalConfig: Config = defaultsDeep({}, config, DEFAULT_CONFIG);

  let Cls: RxImmerConstructable<T> = RxImmerBase;

  if (finalConfig.replay) {
    Cls = generateReplayMode(Cls as typeof RxImmerBase);
    return Cls;
  }

  if (finalConfig.history) {
    Cls = generateWithHistory(Cls as typeof RxImmerBase, finalConfig.history);
  }

  if (finalConfig.diachrony) {
    Cls = generateWithDiachrony(Cls as typeof RxImmerBase);
  }

  return Cls;
}

export function createRxImmer<T extends Objectish>(
  initial: T,
  config?: DeepPartial<Config>
) {
  return new (factory<T>(config))(initial);
}
