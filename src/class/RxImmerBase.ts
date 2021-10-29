import { filter, map, Observable, startWith, Subject } from 'rxjs';
import { castImmutable, Draft, Immutable, produceWithPatches } from 'immer';
import { get, isObjectLike } from 'lodash';

import type { Objectish, Patches, PatchesTuple, Path } from '../type';
import { isCommitValid, isContained } from '../utils';
import { NonObjectishError } from '../const';

export interface IRxImmerBase<T extends Objectish> {
  value(): Immutable<T>;

  observe(): Observable<Immutable<T>>;
  observe<V = any>(listenPath: Path): Observable<Immutable<V> | undefined>;

  commit(recipe: (draft: Draft<T>) => void): void;
  commit<V extends Objectish>(
    recipe: (draft: Draft<V>) => void,
    targetPath: Path
  ): void;

  destroy(): void;
}

export class RxImmerBase<T extends Objectish> implements IRxImmerBase<T> {
  protected store: Immutable<T>;
  protected patchesTuple$ = new Subject<PatchesTuple>();

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
      targetPath === undefined
        ? recipe
        : (draft: any) => {
            const target = get(draft, targetPath);
            if (!isObjectLike(target)) throw NonObjectishError;
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

  public destroy() {
    this.patchesTuple$.complete();
  }
}
