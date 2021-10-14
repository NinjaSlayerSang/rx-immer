import {
  FunctionComponent,
  MutableRefObject,
  useImperativeHandle,
  useState,
} from 'react';
import { Modal } from 'antd';
import { useRxImmer } from 'rx-immer';
import ReplaySlider from './components/ReplaySlider';
import Editor from './components/Editor';
import { INITIAL_STORE } from './const';
import { ReplayActions, Store } from '.';

interface ReplayProps {
  actionRef: MutableRefObject<ReplayActions | undefined>;
}

const Replay: FunctionComponent<ReplayProps> = (props) => {
  const { actionRef } = props;

  const store = useRxImmer<Store>(INITIAL_STORE, {
    replay: true,
  });

  const [visible, setVisible] = useState(false);
  const [timeStamp, setTimeStamp] = useState(Date.now());

  useImperativeHandle(
    actionRef,
    () => ({
      open: (diachrony) => {
        store.setDiachrony?.(diachrony);
        setVisible(true);
      },
    }),
    [store],
  );

  return (
    <Modal
      title={`重播: ${new Date(timeStamp).toLocaleTimeString(undefined, {
        hour12: false,
      })}.${timeStamp.toString().substr(-3, 3)}`}
      width="90vw"
      visible={visible}
      footer={<ReplaySlider store={store} wait={10} onChange={setTimeStamp} />}
      onCancel={() => {
        setVisible(false);
      }}
    >
      <Editor store={store} />
    </Modal>
  );
};

export default Replay;
