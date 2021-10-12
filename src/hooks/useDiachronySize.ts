import { useEffect, useState } from 'react';

import type { RxImmer } from '../class';

export interface WithUseDiachronySize {
  useDiachronySize(): number;
}

export function injectUseDiachronySize<T>(
  rxImmer: RxImmer<T> & Partial<WithUseDiachronySize>
) {
  rxImmer.useDiachronySize = function () {
    const [size, setSize] = useState(this.size$?.getValue() ?? 0);

    useEffect(() => {
      const subscription = this.size$?.subscribe((value) => {
        setSize(value);
      });
      return () => {
        subscription?.unsubscribe();
      };
    }, [this]);

    return size;
  };
  return rxImmer as RxImmer<T> & WithUseDiachronySize;
}
