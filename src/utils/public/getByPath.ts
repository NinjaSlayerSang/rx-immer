import { get } from 'lodash';

import type { Path } from '../../type';
import { isEmptyPath } from './isEmptyPath';

export function getByPath<T, R = any>(s: T, path?: Path): R {
  return isEmptyPath(path) ? s : get(s, path);
}
