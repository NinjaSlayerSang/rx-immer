import type { Path } from '../../type';

export const assemblePath = (path?: Path) =>
  Array.isArray(path)
    ? path.reduce<string>(
        (pv, cv: any) =>
          isNaN(cv) ? pv.concat('.', cv) : pv.concat('[', cv, ']'),
        ''
      )
    : path ?? '';
