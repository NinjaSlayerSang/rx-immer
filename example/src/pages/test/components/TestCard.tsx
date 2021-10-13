import type { FunctionComponent, MutableRefObject } from 'react';
import { Button, Card, Input, InputNumber, Space } from 'antd';
import type { PropsWithStore, ReplayActions } from '..';

interface TestCardProps {
  replayRef: MutableRefObject<ReplayActions | undefined>;
}

const TestCard: FunctionComponent<TestCardProps & PropsWithStore> = (props) => {
  const { store, replayRef, children } = props;

  const title = store.useBind<string | undefined>(['title']);
  const count = store.useBind<number>(['count']);

  const [undos, redos] = store.useRoamStatus?.() ?? [0, 0];

  return (
    <Card
      title={title}
      extra={
        <Space>
          <Button
            type="primary"
            size="middle"
            danger
            onClick={() => {
              store.revert?.();
            }}
            disabled={!undos}
          >
            回滚{!!undos && `(${undos})`}
          </Button>
          <Button
            type="primary"
            size="middle"
            onClick={() => {
              store.recover?.();
            }}
            disabled={!redos}
          >
            恢复{!!redos && `(${redos})`}
          </Button>
        </Space>
      }
      actions={[
        <Space>
          标题:
          <Input
            value={title}
            onChange={(event) => {
              store.commit((draft) => {
                draft.title = event.target.value;
              });
            }}
          />
        </Space>,
        <Space>
          列表最大长度:
          <InputNumber
            value={count}
            onChange={(value) => {
              store.commit((draft) => {
                draft.count = value;
              });
            }}
          />
        </Space>,
        <Button
          onClick={() => {
            const diachrony = store.archive?.();
            if (diachrony) {
              console.log(diachrony);
              replayRef.current?.open(diachrony);
            }
          }}
        >
          归档并重播
        </Button>,
      ]}
    >
      {children}
    </Card>
  );
};

export default TestCard;
