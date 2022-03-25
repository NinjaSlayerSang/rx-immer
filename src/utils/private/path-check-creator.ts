import type { Path, TrimmedPath } from '../../type';
import { trimPath } from '../public';

export const pathCheckerCreator = (path: Path) => (targetPath: TrimmedPath) => {
  const listenPath = trimPath(path);
  return listenPath.length <= targetPath.length
    ? listenPath.every((value, index) => value == targetPath[index])
    : targetPath.every((value, index) => value == listenPath[index]);
};
