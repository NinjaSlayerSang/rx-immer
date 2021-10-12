import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { useRxImmer } from '../dist';

const App = () => {
  const store = useRxImmer({});

  window.store = store;

  return <div>EXAMPLE</div>;
};

ReactDOM.render(<App />, document.getElementById('root'));
