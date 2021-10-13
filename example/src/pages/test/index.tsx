import { useRef } from 'react';
import { FieldData } from 'rc-field-form/lib/interface';
import { Diachrony, RxImmerWithHooks, useRxImmer } from '../../rx-immer';
import TestCard from './components/TestCard';
import { ListItem } from './components/TableEditor';
import { TreeData } from './components/TreeEditor';
import Editor from './components/Editor';
import { INITIAL_STORE } from './const';
import Replay from './replay';

export interface Store {
  count: number;
  title?: string;
  list: ListItem[];
  fields: FieldData[];
  obj: Record<string, any>;
  tree: TreeData;
}

export interface ReplayActions {
  open: (diachrony: Diachrony<Store>) => void;
}

export interface PropsWithStore {
  store: RxImmerWithHooks<Store>;
}

export default function Test() {
  const store = useRxImmer<Store>(INITIAL_STORE, {
    history: {
      capacity: 20,
      bufferDebounce: 500,
    },
    diachrony: true,
  });

  const replayRef = useRef<ReplayActions>();

  return (
    <div
      style={{
        padding: '2%',
        backgroundColor: 'lightgray',
        minHeight: '100vh',
      }}
    >
      <TestCard store={store} replayRef={replayRef}>
        <Editor store={store} />
      </TestCard>
      <Replay actionRef={replayRef} />
    </div>
  );
}
