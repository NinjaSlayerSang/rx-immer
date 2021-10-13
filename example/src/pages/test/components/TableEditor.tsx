import type { FunctionComponent, Key } from 'react';
import {
  Button,
  Card,
  Divider,
  Input,
  Select,
  Space,
  Switch,
  Table,
} from 'antd';
import { uniqueId } from 'lodash';
import type { PropsWithStore } from '..';
import { updateDeep } from '../utils';

export interface ListItem {
  id: Key;
  name?: string;
  status?: string;
  enable: boolean;
}

const TableEditor: FunctionComponent<PropsWithStore> = (props) => {
  const { store } = props;
  const listPathInStore = ['list'];

  const dataSource = store.useBind<ListItem[]>(listPathInStore);
  const count = store.useBind<number>(['count']) ?? 0;

  return (
    <Card size="small" title="列表编辑">
      <Table
        size="small"
        rowKey="id"
        dataSource={dataSource}
        columns={[
          { title: 'ID', dataIndex: 'id' },
          {
            title: '名称',
            dataIndex: 'name',
            render: (value: string | undefined, record, index) => {
              return (
                <Input
                  value={value}
                  onChange={(event) => {
                    store.commit<ListItem>(
                      (item) => {
                        item.name = event.target.value;
                      },
                      [...listPathInStore, index]
                    );
                  }}
                />
              );
            },
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: string | undefined, record, index) => {
              return (
                <Select
                  style={{ width: 80 }}
                  options={[
                    { value: 'default', label: '默认' },
                    { value: 'success', label: '成功' },
                    { value: 'error', label: '错误' },
                    { value: 'warning', label: '警告' },
                  ]}
                  value={value}
                  onChange={(v) => {
                    store.commit<ListItem>(
                      (item) => {
                        item.status = v;
                      },
                      [...listPathInStore, index]
                    );
                  }}
                />
              );
            },
            width: 100,
          },
          {
            title: '开关',
            dataIndex: 'enable',
            render: (value: boolean | undefined, record, index) => {
              return (
                <Switch
                  checked={value}
                  onChange={(v) => {
                    store.commit<ListItem>(
                      (item) => {
                        item.enable = v;
                      },
                      [...listPathInStore, index]
                    );
                  }}
                />
              );
            },
            width: 60,
          },
          {
            title: '操作',
            render: (value, record, index) => {
              return (
                <Button
                  type="link"
                  danger
                  onClick={() => {
                    store.commit<ListItem[]>((list) => {
                      list.splice(index, 1);
                    }, listPathInStore);
                  }}
                >
                  删除
                </Button>
              );
            },
            align: 'center',
            width: 80,
          },
        ]}
        footer={(data) => {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  store.commit<ListItem[]>((list) => {
                    list.push({
                      id: uniqueId(),
                      enable: false,
                    });
                  }, listPathInStore);
                }}
                disabled={data.length >= count}
              >
                新增
              </Button>
              {`(${data.length}/${count})`}
              {<Divider type="vertical" />}
              <Button
                size="small"
                onClick={() => {
                  store.commit<ListItem[]>(
                    (list) => {
                      list.forEach((item) => {
                        item.enable = true;
                      });
                    },
                    ['list']
                  );
                }}
              >
                允许所有
              </Button>
              <Button
                size="small"
                onClick={() => {
                  store.commit<ListItem[]>(
                    (list) => {
                      const newList = list.filter(
                        (item) => item.name && item.status
                      );
                      updateDeep(list, newList);
                    },
                    ['list']
                  );
                }}
              >
                删除空行
              </Button>
            </Space>
          );
        }}
        pagination={false}
      />
    </Card>
  );
};

export default TableEditor;
