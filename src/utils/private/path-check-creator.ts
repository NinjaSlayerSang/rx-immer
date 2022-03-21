import { trimPath } from '../public';

import type { Path, TrimmedPath } from '../../type';

export const pathCheckerCreator = (path: Path) => (targetPath: TrimmedPath) => {
  const listenPath = trimPath(path);
  return listenPath.length <= targetPath.length
    ? listenPath.every((value, index) => value == targetPath[index])
    : targetPath.every((value, index) => value == listenPath[index]);
};
