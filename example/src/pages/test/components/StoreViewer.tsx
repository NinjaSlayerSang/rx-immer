import type { FunctionComponent, Key } from 'react';
import { useState } from 'react';
import { Button, Card, Drawer, Input, Space, Table, Typography } from 'antd';
import { Subscription } from 'rxjs';
import { uniqueId } from 'lodash';
import type { PropsWithStore } from '..';

interface ListenTableItem {
  key: Key;
  path?: string;
  value?: any;
  updateTime?: Date;
  subscription?: Subscription;
}

function modifyWithKey<T extends { key: Key }>(
  data: T[],
  key: Key,
  modifier: (datum: T) => T
): T[] {
  return data.map((datum) => {
    if (datum.key === key) {
      return modifier(datum);
    }
    return datum;
  });
}

const StoreViewer: FunctionComponent<PropsWithStore> = (props) => {
  const { store } = props;

  const value = store.useBind();

  const [visible, setVisible] = useState(false);
  const [dataSource, setDataSource] = useState<ListenTableItem[]>([]);

  const modifyDataSourceWithKey = (
    key: Key,
    modifier: (datum: ListenTableItem) => ListenTableItem
  ) => {
    setDataSource((currentDataSource) =>
      modifyWithKey(currentDataSource, key, modifier)
    );
  };

  return (
    <Card
      size="small"
      title="store查看"
      extra={
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setVisible(true);
          }}
        >
          监听列表
        </Button>
      }
    >
      <Typography.Paragraph>
        <pre style={{ height: '65vh', overflowY: 'scroll' }}>
          {JSON.stringify(value, undefined, 4)}
        </pre>
      </Typography.Paragraph>
      <Drawer
        title="监听列表"
        placement="left"
        width="30vw"
        visible={visible}
        onClose={() => {
          setVisible(false);
        }}
        mask={false}
      >
        <Table
          size="small"
          columns={[
            {
              title: '路径',
              dataIndex: 'path',
              render: (value: string | undefined, record) => {
                if (record.subscription) {
                  return value;
                } else {
                  return (
                    <Space size="small">
                      <Input
                        value={value}
                        onChange={(event) => {
                          modifyDataSourceWithKey(record.key, (datum) => ({
                            ...datum,
                            path: event.target.value,
                          }));
                        }}
                      />
                      <Button
                        style={{ padding: 0 }}
                        type="link"
                        onClick={() => {
                          const { path, key } = record;
                          const subscription = store
                            .observe(path!)
                            .subscribe((value) => {
                              modifyDataSourceWithKey(key, (datum) => ({
                                ...datum,
                                value,
                                updateTime: new Date(),
                              }));
                            });
                          modifyDataSourceWithKey(key, (datum) => ({
                            ...datum,
                            subscription,
                          }));
                        }}
                        disabled={!record.path}
                      >
                        监听
                      </Button>
                    </Space>
                  );
                }
              },
            },
            {
              title: '值',
              dataIndex: 'value',
              render: (value) => `${value}`,
            },
            {
              title: '更新时间',
              dataIndex: 'updateTime',
              render: (value?: Date) => value?.toLocaleTimeString(),
              width: 100,
            },
            {
              title: '操作',
              render: (value, record) => {
                return (
                  <Button
                    type="link"
                    danger
                    onClick={() => {
                      record.subscription?.unsubscribe();
                      setDataSource((currentDataSource) =>
                        currentDataSource.filter(
                          (datum) => datum.key !== record.key
                        )
                      );
                    }}
                  >
                    移除
                  </Button>
                );
              },
              align: 'center',
              width: 80,
            },
          ]}
          dataSource={dataSource}
          footer={() => (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setDataSource((currentDataSource) =>
                  currentDataSource.concat({ key: uniqueId() })
                );
              }}
            >
              新增
            </Button>
          )}
        />
      </Drawer>
    </Card>
  );
};

export default StoreViewer;
