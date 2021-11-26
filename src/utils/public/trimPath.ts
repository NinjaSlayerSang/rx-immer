import { toPath } from 'lodash';

import type { Path } from '../../type';

export const trimPath = (path?: Path) =>
  toPath(path).map((c) => (isNaN(c as any) ? c : parseInt(c)));
