import type { PatchesTuple } from '../../type';

export const isPatchesTupleValid = (record: PatchesTuple) => {
  return record[0].length > 0 && record[1].length > 0;
};

export function reversePatchesTuple(patchesTuple: PatchesTuple): PatchesTuple {
  const [patches, inversePatches] = patchesTuple;
  return [inversePatches, patches];
}
