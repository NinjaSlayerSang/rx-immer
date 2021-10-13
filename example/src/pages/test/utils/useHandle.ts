import { useImperativeHandle, useRef } from 'react';

export function useHandle<T extends unknown[], R>(
  source: (...args: T) => R
): (...args: T) => R | undefined {
  const ref = useRef<(...args: T) => R>();
  useImperativeHandle(ref, () => source, [source]);
  return (...args: T) => ref.current?.(...args);
}
