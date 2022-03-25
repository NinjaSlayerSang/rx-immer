import type { Subscription } from 'rxjs';

import type { Base } from '../core/base';

export default (key: string = 'default') => ({
  name: 'log-plugin',
  generate(Cls: typeof Base): any {
    return class<T> extends Cls<T> {
      private logKey: string = key;
      private logSubscription: Subscription;

      constructor(initial: T) {
        super(initial);

        this.logSubscription = this.patchesTuple$.subscribe((record) => {
          console.log(`[rx-immer][${this.logKey}][$] patches:`, {
            patches: record[0],
            inverse: record[1],
          });
        });

        console.log(
          `[rx-immer][${this.logKey}][constructor] initial value:`,
          initial
        );
      }

      update(state, record) {
        super.update(state, record);

        console.log(`[rx-immer][${this.logKey}][update] state:`, state);
      }

      broadcast(record) {
        super.broadcast(record);

        console.log(`[rx-immer][${this.logKey}][broadcast] patches:`, record);
      }

      destroy() {
        this.logSubscription.unsubscribe();

        super.destroy();
      }
    };
  },
});
