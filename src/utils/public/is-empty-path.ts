import type { Path } from '../../type';

export function isEmptyPath(path?: Path): path is undefined {
  return path === undefined || (typeof path !== 'number' && path.length === 0);
}
