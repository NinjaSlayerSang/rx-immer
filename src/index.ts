import { enableMapSet, enablePatches } from 'immer';

export * from './type';
export * from './core';
export * from './utils/public';
export * from './const';
export * from './plugins';

enableMapSet();
enablePatches();
