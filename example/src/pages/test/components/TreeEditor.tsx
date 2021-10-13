import { FunctionComponent, Key } from 'react';
import { useState } from 'react';
import { Button, Card, Input, Space, Tree } from 'antd';
import type { DataNode } from 'antd/lib/tree';
import { uniqueId } from 'lodash';
import type { PropsWithStore } from '..';

interface TreeNode {
  key: Key;
  title: string;
  children?: TreeNode[];
}

interface NodeTitleProps extends PropsWithStore {
  node: DataNode;
  selected?: boolean;
  dragging?: boolean;
}

export interface TreeData {
  checkedKeys: Key[];
  root: TreeNode[];
}

function findNodeByKey(root: TreeNode[], key: Key): TreeNode | undefined {
  return (
    root.find((item) => item.key === key) ||
    findNodeByKey(
      root.flatMap((item) => item.children ?? []),
      key
    )
  );
}

function findFatherByKey(root: TreeNode[], key: Key): TreeNode | undefined {
  return (
    root.find((item) => item.children?.some((child) => child.key === key)) ||
    findFatherByKey(
      root.flatMap((item) => item.children ?? []),
      key
    )
  );
}

function touchChildrenByKey(root: TreeNode[], key: Key) {
  const node = findNodeByKey(root, key)!;
  if (!node.children) node.children = [];
  return node.children;
}

function touchFatherChildrenByKey(root: TreeNode[], key: Key): TreeNode[] {
  if (root.some((child) => child.key === key)) {
    return root;
  } else {
    return findFatherByKey(root, key)!.children!;
  }
}

function newNode(): TreeNode {
  const key = uniqueId();
  return {
    key,
    title: 'new',
  };
}

const NodeTitle: FunctionComponent<NodeTitleProps> = (props) => {
  const { store, node, selected, dragging } = props;
  const treePathInStore = ['tree'];

  const [hover, setHover] = useState(false);
  const [edit, setEdit] = useState(false);

  return (
    <Space
      size="large"
      onMouseEnter={() => {
        setHover(true);
      }}
      onMouseLeave={() => {
        setHover(false);
      }}
    >
      {edit ? (
        <Input
          style={{ margin: '2px 0' }}
          size="small"
          value={`${node.title}`}
          onChange={(event) => {
            store.commit<TreeNode[]>(
              (root) => {
                const target = findNodeByKey(root, node.key);
                if (target) {
                  target.title = event.target.value;
                }
              },
              [...treePathInStore, 'root']
            );
          }}
        />
      ) : (
        node.title
      )}
      {(edit || selected || (hover && !dragging)) && (
        <Space size="small">
          <a
            onClick={(event) => {
              event.stopPropagation();
              setEdit((e) => !e);
            }}
          >
            {edit ? '保存' : '编辑'}
          </a>
          <a
            onClick={(event) => {
              event.stopPropagation();
              store.commit<TreeNode[]>(
                (root) => {
                  const index = root.findIndex((item) => item.key === node.key);
                  if (index > -1) {
                    root.splice(index, 1);
                  } else {
                    const father = findFatherByKey(root, node.key);
                    if (father?.children) {
                      father.children.splice(
                        father.children.findIndex(
                          (child) => child.key === node.key
                        ),
                        1
                      );
                    }
                  }
                },
                [...treePathInStore, 'root']
              );
            }}
          >
            删除
          </a>
          <a
            onClick={(event) => {
              event.stopPropagation();
              store.commit<TreeNode[]>(
                (root) => {
                  const target = findNodeByKey(root, node.key);
                  if (target) {
                    if (target.children) {
                      target.children.push(newNode());
                    } else {
                      target.children = [newNode()];
                    }
                  }
                },
                [...treePathInStore, 'root']
              );
            }}
          >
            新增
          </a>
        </Space>
      )}
    </Space>
  );
};

const TreeEditor: FunctionComponent<PropsWithStore> = (props) => {
  const { store } = props;
  const treePathInStore = ['tree'];

  const checkedKeys = store.useBind([...treePathInStore, 'checkedKeys']);
  const root = store.useBind([...treePathInStore, 'root']);

  const [draggingKey, setDraggingKey] = useState<Key>();
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);

  return (
    <Card
      size="small"
      title="树编辑"
      extra={
        <Button
          type="primary"
          size="small"
          onClick={() => {
            store.commit<TreeNode[]>(
              (root) => {
                root.push(newNode());
              },
              [...treePathInStore, 'root']
            );
          }}
        >
          新增
        </Button>
      }
    >
      <Tree
        treeData={root}
        titleRender={(node) => {
          return (
            <NodeTitle
              key={node.key}
              store={store}
              node={node}
              selected={selectedKeys.includes(node.key)}
              dragging={draggingKey === node.key}
            />
          );
        }}
        checkable
        checkedKeys={checkedKeys}
        onCheck={(keys) => {
          store.commit<TreeData>((tree) => {
            tree.checkedKeys = keys as Key[];
          }, treePathInStore);
        }}
        draggable
        onDragStart={({ node }) => {
          setDraggingKey(node.key);
        }}
        onDragEnd={({ node }) => {
          setDraggingKey(undefined);
        }}
        onDrop={(info) => {
          const {
            dragNode: { key: dragNodeKey },
            node: { key: nodeKey },
            dropPosition,
            dropToGap,
          } = info;
          store.commit<TreeNode[]>(
            (root) => {
              const sourceFatherNodeChildren = touchFatherChildrenByKey(
                root,
                dragNodeKey
              );
              const targetFatherNodeChildren = dropToGap
                ? touchFatherChildrenByKey(root, nodeKey)
                : touchChildrenByKey(root, nodeKey);

              const index = sourceFatherNodeChildren.findIndex(
                (child) => child.key === dragNodeKey
              );
              const [dragNode] = sourceFatherNodeChildren.splice(index, 1);

              targetFatherNodeChildren.splice(
                dropToGap ? Math.max(dropPosition, 0) : 0,
                0,
                dragNode
              );
            },
            [...treePathInStore, 'root']
          );
        }}
        multiple
        selectedKeys={selectedKeys}
        onSelect={setSelectedKeys}
        defaultExpandAll
      />
    </Card>
  );
};

export default TreeEditor;
