import { FunctionComponent } from 'react';
import { Col, Row } from 'antd';
import FormEditor from './FormEditor';
import StoreViewer from './StoreViewer';
import TableEditor from './TableEditor';
import TreeEditor from './TreeEditor';
// import ObjEditor from './ObjEditor';
import { PropsWithStore } from '..';

const Editor: FunctionComponent<PropsWithStore> = (props) => {
  const { store } = props;

  return (
    <Row gutter={16} wrap>
      <Col span={8}>
        <StoreViewer store={store} />
      </Col>
      <Col span={16}>
        <Row gutter={[16, 8]} wrap>
          <Col span={24}>
            <FormEditor store={store} />
          </Col>
          <Col span={12}>
            <TableEditor store={store} />
          </Col>
          <Col span={12}>
            <TreeEditor store={store} />
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default Editor;
