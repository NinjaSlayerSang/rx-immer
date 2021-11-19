import { filter, map, Observable, startWith, Subject } from 'rxjs';
import { castImmutable, Draft, Immutable, produceWithPatches } from 'immer';
import { get, isObjectLike } from 'lodash';

import type { Objectish, Patches, PatchesTuple, Path } from '../type';
import {
  invalidPathToObjectishError,
  invalidPathToValueError,
  isCommitValid,
  isContained,
  isEmptyPath,
  trimPath,
  Wrapper,
} from '../utils';

export interface IBase<T extends Objectish> {
  value(): Immutable<T>;

  observe(): Observable<Immutable<T>>;
  observe<V = any>(listenPath: Path): Observable<Immutable<V>>;

  commit(recipe: (draft: Draft<T>) => void): void;
  commit<V extends Objectish>(
    recipe: (draft: Draft<V>) => void,
    targetPath: Path
  ): void;

  commitValue<V = any>(recipe: (wrapper: Wrapper<V>) => void, targetPath: Path);

  readonly destroyed: boolean;

  destroy(): void;
}

export class Base<T extends Objectish> implements IBase<T> {
  protected store: Immutable<T>;
  protected patchesTuple$ = new Subject<PatchesTuple>();

  public destroyed = false;

  public constructor(initial: T) {
    this.store = castImmutable(initial);
  }

  // life cycle
  protected onCommit(record: PatchesTuple) {}

  // implements
  public value(): Immutable<T> {
    return this.store;
  }

  public observe(listenPath?: Path) {
    if (listenPath === undefined) {
      return this.patchesTuple$.pipe(
        map(() => this.store),
        startWith(this.store)
      );
    }
    const checkPath = isContained(listenPath);
    return this.patchesTuple$.pipe(
      filter((patches) => patches[0].some((patch) => checkPath(patch.path))),
      map(() => get(this.store, listenPath)),
      startWith(get(this.store, listenPath))
    );
  }

  public commit(recipe: (draft: any) => void, targetPath?: Path) {
    const optionalRecipe =
      targetPath === undefined || isEmptyPath(targetPath)
        ? recipe
        : (draft) => {
            const target = get(draft, targetPath);
            if (!isObjectLike(target))
              throw invalidPathToObjectishError(targetPath);
            recipe(target);
          };
    let record: PatchesTuple;

    [this.store, ...record] = produceWithPatches(
      this.store as T,
      optionalRecipe
    ) as [Immutable<T>, Patches, Patches];

    if (isCommitValid(record)) {
      this.patchesTuple$.next(record);
      this.onCommit(record);
    }
  }

  public commitValue<V>(
    recipe: (wrapper: Wrapper<V>) => void,
    targetPath: Path
  ) {
    const upperPath = trimPath(targetPath);
    const self = upperPath.pop();

    if (self === undefined) throw invalidPathToValueError(targetPath);

    const wrappedRecipe = (upper) => {
      const wrapper = new Wrapper(
        () => upper[self],
        (value) => {
          upper[self] = value;
        }
      );

      recipe(wrapper);
    };

    this.commit(wrappedRecipe, upperPath);
  }

  public destroy() {
    this.patchesTuple$.complete();
    this.destroyed = true;
  }
}
