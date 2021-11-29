import { filter, map, Observable, startWith, Subject } from 'rxjs';
import produce, {
  castImmutable,
  Draft,
  Immutable,
  nothing,
  produceWithPatches,
} from 'immer';
import { isObjectLike } from 'lodash';

import type { Nothing, Objectish, PatchesTuple, Path } from '../type';
import {
  getByPath,
  invalidPathToObjectishError,
  invalidPathToValueError,
  isPatchesTupleValid,
  pathCheckerCreator,
  isEmptyPath,
  trimPath,
} from '../utils';

declare type ValidRecipeReturnType<State> =
  | State
  | void
  | undefined
  | (State extends undefined ? Nothing : never);

export interface IBase<T extends Objectish> {
  value(): Immutable<T>;
  value<V = any>(path: Path): Immutable<V>;

  observe(): Observable<Immutable<T>>;
  observe<V = any>(listenPath: Path): Observable<Immutable<V>>;

  commit(recipe: (draft: Draft<T>) => ValidRecipeReturnType<T>): void;
  commit<V>(
    recipe: (draft: Draft<V>) => ValidRecipeReturnType<T>,
    targetPath: Path
  ): void;

  commitAsync(
    recipe: (draft: Draft<T>) => Promise<ValidRecipeReturnType<T>>
  ): Promise<void>;
  commitAsync<V>(
    recipe: (draft: Draft<V>) => Promise<ValidRecipeReturnType<V>>,
    targetPath: Path
  ): Promise<void>;

  readonly destroyed: boolean;

  destroy(): void;
}

export class Base<T extends Objectish> implements IBase<T> {
  protected state: Immutable<T>;
  protected patchesTuple$ = new Subject<PatchesTuple>();

  public destroyed = false;

  public constructor(initial: T) {
    this.state = castImmutable(initial);
  }

  // life cycle
  protected onCommit(record: PatchesTuple) {
    if (isPatchesTupleValid(record)) {
      this.patchesTuple$.next(record);
    }
  }

  // implements
  public value(path?: Path) {
    return getByPath(this.state, path);
  }

  public observe(listenPath?: Path) {
    if (isEmptyPath(listenPath)) {
      return this.patchesTuple$.pipe(
        map(() => this.state),
        startWith(this.state)
      );
    }
    const pathChecker = pathCheckerCreator(listenPath);
    return this.patchesTuple$.pipe(
      filter((patches) => patches[0].some((patch) => pathChecker(patch.path))),
      map(() => getByPath(this.state, listenPath)),
      startWith(getByPath(this.state, listenPath))
    );
  }

  public commit(recipe: (draft: any) => any, targetPath?: Path) {
    const optionalRecipe = isEmptyPath(targetPath)
      ? recipe
      : (draft) => {
          const target = getByPath(draft, targetPath);

          const result = recipe(target);

          if (result !== undefined) {
            const upperPath = trimPath(targetPath);
            const self = upperPath.pop();
            const upper = getByPath(draft, upperPath);

            if (!isObjectLike(upper)) {
              throw invalidPathToObjectishError(upperPath);
            }
            if (self === undefined) {
              throw invalidPathToValueError(targetPath);
            }

            if (result === nothing) {
              if (Array.isArray(upper)) {
                upper.splice(self as number, 1);
              } else if (upper instanceof Map || upper instanceof Set) {
                upper.delete(self);
              } else {
                delete upper[self];
              }
            } else {
              upper[self] = result;
            }
          }
        };

    const [state, ...record] = produceWithPatches(this.state, optionalRecipe);

    this.state = state;
    this.onCommit([...record]);
  }

  public commitAsync(recipe: (draft: any) => Promise<any>, targetPath?: Path) {
    const optionalRecipe = isEmptyPath(targetPath)
      ? recipe
      : async (draft) => {
          const target = getByPath(draft, targetPath);

          const result = await recipe(target);

          if (result !== undefined) {
            const upperPath = trimPath(targetPath);
            const self = upperPath.pop();
            const upper = getByPath(draft, upperPath);

            if (!isObjectLike(upper)) {
              throw invalidPathToObjectishError(upperPath);
            }
            if (self === undefined) {
              throw invalidPathToValueError(targetPath);
            }

            if (result === nothing) {
              if (Array.isArray(upper)) {
                upper.splice(self as number, 1);
              } else if (upper instanceof Map || upper instanceof Set) {
                upper.delete(self);
              } else {
                delete upper[self];
              }
            } else {
              upper[self] = result;
            }
          }
        };

    let closureRecord: PatchesTuple;
    return produce(this.state as any, optionalRecipe, (...record) => {
      closureRecord = [...record];
    }).then((state) => {
      this.state = state;
      this.onCommit(closureRecord);
    });
  }

  public destroy() {
    this.patchesTuple$.complete();
    this.destroyed = true;
  }
}
