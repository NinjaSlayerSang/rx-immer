import { create, nothing } from '../src';

describe('base', () => {
  test('init & set state & get concurrent value', () => {
    const store = create<{
      a: string;
      b: number;
      c: boolean;
      d?: any;
    }>({
      a: 'text',
      b: 0,
      c: false,
    });

    expect(store.value().a).toBe('text');
    expect(store.value('b')).toBe(0);
    expect(store.value(['c'])).toBe(false);

    store.commit((state) => {
      state.a = 'edited';
    });

    expect(store.value().a).toBe('edited');

    store.commit<number>((b) => b + 1, 'b');

    expect(store.value('b')).toBe(1);
    expect(store.find('$.b')).toEqual([1]);

    store.commit<boolean>((c) => !c, ['c']);

    expect(store.value(['c'])).toBe(true);
    expect(store.find('$.c')).toEqual([true]);

    store.commit(() => ({ a: 'new', b: -1, c: false }));

    expect(store.value()).toEqual({ a: 'new', b: -1, c: false });

    store.commit((state) => {
      state.d = 'optional';
    });

    expect(store.value().d).toBe('optional');

    store.commit(() => nothing, 'd');

    expect(store.value('d')).toBeUndefined();
    expect(store.find('$.d')).toHaveLength(0);

    store.commit(() => 123, 'd');

    expect(store.value(['d'])).toBe(123);
    expect(store.find('$.d')).toEqual([123]);

    store.commit(() => nothing, ['d']);

    expect(store.value()).toEqual({ a: 'new', b: -1, c: false });

    store.destroy();
  });

  test('edit state & observe', () => {
    const store = create<{
      a: {
        b: { c: number };
        d?: string;
      }[];
    }>({ a: [] });

    const listenner = jest.fn();
    const listenner_a_0_b_c = jest.fn();
    const listenner_query = jest.fn();

    store.observe().subscribe(listenner);
    store.observe('a[0].b.c').subscribe(listenner_a_0_b_c);
    store.query('$.a[?(@.b.c>10)].d').subscribe(listenner_query);

    expect(listenner.mock.calls[0]).toEqual([{ a: [] }]);
    expect(listenner_a_0_b_c.mock.calls[0]).toEqual([undefined]);
    expect(listenner_query.mock.calls[0]).toEqual([[]]);

    store.commit<any[]>((a) => {
      a.push({ b: { c: 2 } });
    }, 'a');

    ({
      a: [{ b: { c: 2 } }],
    });

    expect(listenner.mock.calls[1]).toEqual([{ a: [{ b: { c: 2 } }] }]);
    expect(listenner_a_0_b_c.mock.calls[1]).toEqual([2]);
    expect(listenner_query.mock.calls[1]).toEqual([[]]);

    store.commit<number>((c) => c ** 2, 'a[0].b.c');

    ({
      a: [{ b: { c: 4 } }],
    });

    expect(listenner_a_0_b_c.mock.calls[2]).toEqual([4]);
    expect(listenner_query.mock.calls[2]).toEqual([[]]);

    store.commit(() => nothing, ['a', 0, 'b', 'c']);

    ({
      a: [{ b: {} }],
    });

    expect(listenner_a_0_b_c.mock.calls[3]).toEqual([undefined]);
    expect(listenner_query.mock.calls[3]).toEqual([[]]);

    store.commit<any[]>(
      (a) => {
        a.unshift({ b: { c: 100 }, d: 'new' });
      },
      ['a']
    );

    ({
      a: [{ b: { c: 100 }, d: 'new' }, { b: {} }],
    });

    expect(listenner_a_0_b_c.mock.calls[4]).toEqual([100]);
    expect(listenner_query.mock.calls[4]).toEqual([['new']]);

    store.commit((state) => {
      state.a.unshift({ b: { c: 7 } });
    });

    ({
      a: [{ b: { c: 7 } }, { b: { c: 100 }, d: 'new' }, { b: {} }],
    });

    const listenner_a_1_d = jest.fn();

    store.observe(['a', 1, 'd']).subscribe(listenner_a_1_d);

    expect(listenner_a_0_b_c.mock.calls[5]).toEqual([7]);
    expect(listenner_query.mock.calls[5]).toEqual([['new']]);
    expect(listenner_a_1_d.mock.calls[0]).toEqual(['new']);

    store.commit((state) => {
      state.a.shift();
      state.a[0].b = { c: 42 };
    });

    ({
      a: [{ b: { c: 42 }, d: 'new' }, { b: {} }],
    });

    expect(listenner_a_0_b_c.mock.calls[6]).toEqual([42]);
    expect(listenner_query.mock.calls[6]).toEqual([['new']]);
    expect(listenner_a_1_d.mock.calls[1]).toEqual([undefined]);

    store.commit<any[]>((a) => {
      const item: any = {};
      a.unshift(item);
      const b: any = {};
      item.b = b;
      Object.assign(b, { c: 666 });
    }, 'a');

    ({
      a: [{ b: { c: 666 } }, { b: { c: 42 }, d: 'new' }, { b: {} }],
    });

    expect(listenner_a_0_b_c.mock.calls[7]).toEqual([666]);
    expect(listenner_query.mock.calls[7]).toEqual([['new']]);

    store.destroy();
  });

  test('async edit state & observe', async () => {
    const store = create<{
      a: {
        b: { c: number };
        d?: string;
      }[];
    }>({ a: [] });

    const listenner = jest.fn();
    const listenner_a_0_b_c = jest.fn();

    store.observe().subscribe(listenner);
    store.observe('a[0].b.c').subscribe(listenner_a_0_b_c);

    expect(listenner.mock.calls[0]).toEqual([{ a: [] }]);
    expect(listenner_a_0_b_c.mock.calls[0]).toEqual([undefined]);

    await store.commitAsync<any[]>(async (a) => {
      a.push({ b: { c: 2 } });
    }, 'a');

    expect(listenner.mock.calls[1]).toEqual([{ a: [{ b: { c: 2 } }] }]);
    expect(listenner_a_0_b_c.mock.calls[1]).toEqual([2]);

    await store.commitAsync<number>(async (c) => c ** 2, 'a[0].b.c');

    expect(listenner_a_0_b_c.mock.calls[2]).toEqual([4]);

    await store.commitAsync(async () => nothing, ['a', 0, 'b', 'c']);

    expect(listenner_a_0_b_c.mock.calls[3]).toEqual([undefined]);

    await store.commitAsync<any[]>(
      async (a) => {
        a.unshift({ b: { c: 100 }, d: 'new' });
      },
      ['a']
    );

    expect(listenner_a_0_b_c.mock.calls[4]).toEqual([100]);

    await store.commitAsync(async (state) => {
      state.a.unshift({ b: { c: 7 } });
    });

    const listenner_a_1_d = jest.fn();

    store.observe(['a', 1, 'd']).subscribe(listenner_a_1_d);

    expect(listenner_a_0_b_c.mock.calls[5]).toEqual([7]);
    expect(listenner_a_1_d.mock.calls[0]).toEqual(['new']);

    await store.commitAsync(async (state) => {
      state.a.shift();
      state.a[0].b = { c: 42 };
    });

    expect(listenner_a_0_b_c.mock.calls[6]).toEqual([42]);
    expect(listenner_a_1_d.mock.calls[1]).toEqual([undefined]);

    await store.commitAsync<any[]>(async (a) => {
      const item: any = {};
      a.unshift(item);
      const b: any = {};
      item.b = b;
      Object.assign(b, { c: 666 });
    }, 'a');

    expect(listenner_a_0_b_c.mock.calls[7]).toEqual([666]);

    store.destroy();
  });
});
