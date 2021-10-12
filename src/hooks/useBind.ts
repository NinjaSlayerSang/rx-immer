import type { Immutable } from 'immer/dist/internal';
import { useEffect, useState } from 'react';
import { get } from 'lodash';

import type { RxImmer } from '../class';
import type { Path } from '../type';

export function useRxImmerBind<T>(rxImmer: RxImmer<T>): Immutable<T>;

export function useRxImmerBind<T, V = any>(
  rxImmer: RxImmer<T>,
  listenPath: Path,
): Immutable<V> | undefined;

export function useRxImmerBind<T>(rxImmer: RxImmer<T>, listenPath?: Path) {
  const [value, setValue] = useState(
    listenPath === undefined
      ? rxImmer.value()
      : get(rxImmer.value(), listenPath),
  );

  useEffect(() => {
    const subscription = rxImmer.observe(listenPath!).subscribe((v) => {
      setValue(v);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [rxImmer]);

  return value;
}

export interface WithUseBind<T> {
  useBind(): Immutable<T>;
  useBind<V = any>(listenPath: Path): Immutable<V> | undefined;
}

export function injectUseBind<T>(
  rxImmer: RxImmer<T> & Partial<WithUseBind<T>>,
) {
  rxImmer.useBind = function useBind(listenPath?: Path) {
    return useRxImmerBind(this, listenPath!);
  };
  return rxImmer as RxImmer<T> & WithUseBind<T>;
}
