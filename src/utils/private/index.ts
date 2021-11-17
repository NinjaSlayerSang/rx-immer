import { trimPath } from '../public';

import type { PatchesTuple, Path, TrimmedPath } from '../../type';

export * from './Wrapper';
export * from './error';

export const isContained =
  (rawListenPath: Path) => (targetPath: TrimmedPath) => {
    const listenPath = trimPath(rawListenPath);
    return listenPath.length <= targetPath.length
      ? listenPath.every((value, index) => value == targetPath[index])
      : targetPath.every((value, index) => value == listenPath[index]);
  };

export const isCommitValid = (record: PatchesTuple) => {
  return record[0].length > 0 && record[1].length > 0;
};

export function reversePatchesTuple(patchesTuple: PatchesTuple): PatchesTuple {
  const [patches, inversePatches] = patchesTuple;
  return [inversePatches, patches];
}
