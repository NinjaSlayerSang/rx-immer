import { create } from '../src';

test('welcome', () => {
  const store = create<any>({});

  store.commit((state) => {
    state.welcome = 'Hello, World!';
  });

  expect(store.value()).toEqual({
    welcome: 'Hello, World!',
  });

  store.destroy();
});
