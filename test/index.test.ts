import { create, factory, RxImmer } from '../src';
import { DEFAULT_CONFIG } from '../src/const';

function testBaseIntegrity<T>(store: RxImmer<T>) {
  expect(store.value).toBeDefined();
  expect(store.find).toBeDefined();
  expect(store.observe).toBeDefined();
  expect(store.query).toBeDefined();
  expect(store.commit).toBeDefined();
  expect(store.commitAsync).toBeDefined();

  expect(store.config).toEqual(DEFAULT_CONFIG);

  expect(store.path).toEqual([]);
  expect(store.isSub).toBeFalsy();
  expect(store.startAffair).toBeDefined();
  expect(store.stopAffair).toBeDefined();
  expect(store.hasAffair).toBeDefined();
  expect(store.showAffairs()).toEqual([]);

  expect(store.sub).toBeDefined();
  expect(store.sup()).toBeUndefined();
  expect(store.root()).toBe(store);
}

function testHistoryIntegrity<T>(store: RxImmer<T>) {
  expect(store.withHistory).toBeTruthy();
  expect(store.roamStatus$?.getValue()).toEqual([0, 0]);
  expect(store.getRoamStatus?.()).toEqual([0, 0]);
  expect(store.revert).toBeDefined();
  expect(store.recover).toBeDefined();
  expect(store.reset).toBeDefined();
}

function testDiachronyIntegrity<T>(store: RxImmer<T>) {
  expect(store.withDiachrony).toBeTruthy();
  expect(store.size$?.getValue()).toBe(0);
  expect(store.size?.()).toBe(0);
  expect(store.archive).toBeDefined();
}

function testReplayIntegrity<T>(store: RxImmer<T>) {
  expect(store.replayMode).toBeTruthy();
  expect(store.timeRange$?.getValue()).toHaveLength(2);
  expect(store.setDiachrony).toBeDefined();
  expect(store.getTimeRange?.()).toHaveLength(2);
  expect(store.getKeyframes?.()).toEqual([]);
  expect(store.replay).toBeDefined();
}

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

describe('factory', () => {
  test('default', () => {
    const Cls = factory();
    const store = new Cls({});

    expect(store.destroyed).toBeFalsy();

    testBaseIntegrity(store);

    store.destroy();

    expect(store.destroyed).toBeTruthy();
  });

  test('history', () => {
    const Cls = factory({ history: {} });
    const store = new Cls({});

    testHistoryIntegrity(store);

    store.destroy();
  });

  test('diachrony', () => {
    const Cls = factory({ diachrony: true });
    const store = new Cls({});

    testDiachronyIntegrity(store);

    store.destroy();
  });

  test('replay', () => {
    const Cls = factory({ replay: true });
    const store = new Cls({});

    testReplayIntegrity(store);

    store.destroy();
  });
});

describe('create', () => {
  test('default', () => {
    const store = create({});

    expect(store.destroyed).toBeFalsy();

    testBaseIntegrity(store);

    store.destroy();

    expect(store.destroyed).toBeTruthy();
  });

  test('history', () => {
    const store = create({}, { history: {} });

    testHistoryIntegrity(store);

    store.destroy();
  });

  test('diachrony', () => {
    const store = create({}, { diachrony: true });

    testDiachronyIntegrity(store);

    store.destroy();
  });

  test('replay', () => {
    const store = create({}, { replay: true });

    testReplayIntegrity(store);

    store.destroy();
  });
});
