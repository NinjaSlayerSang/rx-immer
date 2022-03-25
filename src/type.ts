import type { Patch } from 'immer';

export type { Immutable, Nothing, Objectish } from 'immer/dist/internal';

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type TrimmedPath = (string | number)[];
export type Path = string | number | TrimmedPath;

export type Patches = Patch[];
export type PatchesTuple = [Patches, Patches];
export type PatchesTupleGroup = PatchesTuple[];

export interface Plugin {
  name: string;
  generate?: (Class: any) => any;
  runtime?: (instance: any) => any;
}
