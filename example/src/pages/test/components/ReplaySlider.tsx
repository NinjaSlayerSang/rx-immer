import { FunctionComponent, useEffect, useState } from 'react';
import { Slider } from 'antd';
import { debounce } from 'lodash';
import { useHandle } from '../utils';
import { PropsWithStore } from '..';

interface ReplaySliderProps {
  step?: number;
  wait?: number;
  onChange: (value: number) => void;
}

const ReplaySlider: FunctionComponent<ReplaySliderProps & PropsWithStore> = (
  props
) => {
  const { store, step, wait, onChange } = props;
  const handleOnChange = useHandle(onChange);
  const [timeRange, setTimeRange] = useState<[number, number]>();
  const [keyframe, setKeyframe] = useState<number[]>();
  const [timeStamp, setTimeStamp] = useState<number>();

  const onChangeDebounce = debounce((value: number) => {
    handleOnChange(value);
    store.replay?.(value);
  }, wait);

  useEffect(() => {
    const subscription = store.timeRange$?.subscribe((value) => {
      setTimeRange(value);
      setKeyframe(store.getKeyframe?.());
      setTimeStamp(value[0]);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [store]);

  useEffect(() => {
    if (timeStamp) onChangeDebounce(timeStamp);
  }, [timeStamp]);

  return (
    <Slider
      min={timeRange?.[0]}
      max={timeRange?.[1]}
      step={step}
      value={timeStamp}
      onChange={setTimeStamp}
      marks={Object.fromEntries(keyframe?.map((frame) => [frame, false]) ?? [])}
      tooltipVisible={false}
      tipFormatter={null}
    />
  );
};

export default ReplaySlider;
