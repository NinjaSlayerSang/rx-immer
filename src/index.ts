import { enableES5, enableMapSet, enablePatches } from 'immer';

export * from './type';
export * from './core';
export * from './utils/public';
export * from './const';
export * from './plugins';
export * from './plugins/const';

export { enableES5 };
enableMapSet();
enablePatches();
