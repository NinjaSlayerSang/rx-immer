import type { Config, HistoryConfig } from './type';

// Error
export const NonObjectishError = new Error(
  '该路径下的捕获值不是引用对象,因此提交中修改是无效的,请确保路径指向一个引用对象!'
);

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
