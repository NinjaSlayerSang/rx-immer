import { map, Observable } from 'rxjs';
import type { Immutable } from 'immer';
import { JSONPath } from 'jsonpath-plus';

import type { Base } from '../core/_base';

export interface QueryPluginExt {
  find<V = any>(path: string): Immutable<V[]>;

  query<V = any>(path: string): Observable<Immutable<V[]>>;
}

export default {
  name: 'query-plugin',
  generate(Cls: typeof Base): any {
    return class<T> extends Cls<T> implements QueryPluginExt {
      public find(path: string) {
        return JSONPath({ path, json: this.value() });
      }

      public query(path: string) {
        return this.observe().pipe(map((json) => JSONPath({ path, json })));
      }
    };
  },
};
