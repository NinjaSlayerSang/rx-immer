import type { Config, HistoryConfig } from './type';

// Default Config
export const DEFAULT_CONFIG_HISTORY: HistoryConfig = {
  capacity: Number.POSITIVE_INFINITY,
  bufferDebounce: 0,
};

export const DEFAULT_CONFIG: Config = {
  history: DEFAULT_CONFIG_HISTORY,
  diachrony: false,
  replay: false,
};
