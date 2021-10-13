import { uniqueId } from 'lodash';
import type { Store } from '.';

export const INITIAL_STORE: Store = {
  title: 'RxImmer演示',
  count: 10,
  list: [
    { id: uniqueId(), name: 'test', status: 'success', enable: false },
    { id: uniqueId(), name: 'example', status: 'error', enable: true },
  ],
  tree: {
    checkedKeys: [],
    root: [
      {
        key: uniqueId(),
        title: 'example',
        children: [
          { key: uniqueId(), title: 'node' },
          {
            key: uniqueId(),
            title: 'test',
            children: [{ key: uniqueId(), title: 'leaf' }],
          },
        ],
      },
      {
        key: uniqueId(),
        title: 'node',
        children: [],
      },
    ],
  },
  fields: [],
  obj: {
    code: 200,
    success: true,
    data: {
      total: 10,
      list: [
        { id: 1, name: 'abc' },
        { id: 4, name: 'xxx' },
      ],
    },
    message: '成功',
  },
};
