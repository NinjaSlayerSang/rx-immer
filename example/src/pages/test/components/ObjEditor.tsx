import type { FunctionComponent } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { Button, Card } from 'antd';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';
import type { PropsWithStore } from '..';
import { updateDeep } from '../utils';

const ObjEditor: FunctionComponent<PropsWithStore> = (props) => {
  const { store } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor>();

  const isFocusedRef = useRef(false);

  useLayoutEffect(() => {
    if (!containerRef.current) throw new Error();
    editorRef.current = new JSONEditor(containerRef.current);

    editorRef.current.set(store.value().obj);
  }, []);

  return (
    <Card
      size="small"
      title="对象编辑"
      extra={
        <Button
          type="primary"
          size="small"
          onClick={() => {
            const obj = editorRef.current?.get();
            store.commit((draft) => {
              updateDeep(draft.obj, obj);
            });
          }}
        >
          提交
        </Button>
      }
    >
      <div
        ref={containerRef}
        style={{ height: '50vh' }}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
        }}
      />
    </Card>
  );
};

export default ObjEditor;
