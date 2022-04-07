# rx-immer

基于不可变数据(immutable)与响应式数据流(observable)的JavaScript应用状态轻量级管理框架。

- [背景](#背景)
  - [不可变数据(immutable)](#不可变数据immutable)
  - [响应式数据流(observable)](#响应式数据流observable)
- [快速开始](#快速开始)
  - [在项目中引入](#在项目中引入)
  - [创建实例](#创建实例)
  - [监听状态改变](#监听状态改变)
  - [直接获取状态值](#直接获取状态值)
  - [修改状态](#修改状态)
  - [创建子实例](#创建子实例)
  - [销毁实例](#销毁实例)
- [在React项目中使用](#在react项目中使用)
- [扩展功能](#扩展功能)
  - [操作记录栈](#操作记录栈)
  - [历史归档及场景还原](#历史归档及场景还原)
  - [添加事务](#添加事务)
- [工具函数](#工具函数)
- [F&Q](#fq)
  - [我该如何书写commit的recipe函数以完成对状态的更新？](#我该如何书写commit的recipe函数以完成对状态的更新)
  - [只能在状态对象中包含原生Object，Array，Map与Set吗？是否能使用自定义的类？](#只能在状态对象中包含原生objectarraymap与set吗是否能使用自定义的类)

## 背景

### 不可变数据(immutable)

使用[immer.js](https://immerjs.github.io/immer/)库维护应用状态对象的不可变性以及跟踪状态修改的增量信息。
immer能够保持JavaScript可序列化对象的不可变性，当嵌套的对象树的深层属性值发生改变时，能够自动新建对象来记录修改，而不影响到旧有的对象。对于树状结构中未修改的对象则复用旧对象的引用来优化性能（区别于深拷贝，很大程度上避免内存浪费）。

### 响应式数据流(observable)

使用[rxjs](https://rxjs.dev/)库构建用于通知订阅模式的可观察对象observable，用于分发能够应用状态改变的消息。rxjs是主流的响应式编程框架ReactiveX在JavaScript平台的版本，融合了通知订阅模式、迭代器模式、异步调度、函数式编程等多种范式，其特有的操作符能够让开发者方便地利用函数式编程范式解决复杂的业务逻辑，为程序带来良好的扩展性、低耦合性、易调试性等。

## 快速开始

rx-immer具有非常简易实用的基础功能API，使用者不需要关注任何额外的细节或者编程模式，创建、读取、修改、销毁，均可以一个接口一行代码轻松搞定，灵活便捷。

Example:

store.js

```javascript
import { create } from 'rx-immer-react';

const store = create({ v: 1 }); // 实例的初始状态值(initial state)为 { v: 1 }

export default store // 全局单例
```

index.jsx

```JSX
import store from './store';

export default function Index() {
  // 将实例(store)的状态值(state)与组件绑定，当状态发生变化，组件即会自动地重新render
  const state = store.useBind();
  
  return (
    <div>
      {/* 使用状态值 */}
      <span>Value: {state.v}</span>
      <button onClick={() => {
        // 修改状态值
        store.commit((draft) => {
          // 通过直观的赋值语句修改状态值
          draft.v += 1;
        })
      }}>
        Add
      </button>
    </div>
  );
}
```

### 在项目中引入

```bash
npm install rx-immer --save
```

#### 在React项目中

```bash
npm install rx-immer rx-immer-react --save
```

### 创建实例

#### 快速创建

```javascript
import { create } from 'rx-immer';

const store = create({});
```

#### 工厂模式

```javascript
import { factory } from 'rx-immer';

const store = new (factory())({});
```

rx-immer可使用**工厂模式**创建实例，`factory`函数为类工厂，可接受plugin列表，返回被扩展的类，即可使用`new`关键字构建实例。构造函数接受一个**可序列化**的对象（例如Object、Array、Map、Set，可多层嵌套）参数，作为实例的初始状态值。

在*TypeScript*中，`factory<T>`作为泛型函数，能够显式地指定类型，指示状态值的类型信息：

```typescript
import { factory } from 'rx-immer';

interface IState {
  id: number;
  name: string;
  status: boolean;
}

const CustomStore = factory<IState>();

const store = new CustomStore({ id: 0, name: 'abc', status: true });
```

或者使用`create<T>`直接创建实例：

```typescript
import { create } from 'rx-immer';

const store = create({ id: 0, name: 'abc', status: true }, []);
// create<T>可显式指定state类型，也可让ts编译器根据初始状态值推断
// 第二个参数为可选的扩展插件列表
```

#### 在React项目中

rx-immer-react提供了自定义hooks更简单地创建实例。具体请参阅[rx-immer-react项目文档](https://github.com/NinjaSlayerSang/rx-immer-react#%E5%88%9B%E5%BB%BA%E5%AE%9E%E4%BE%8B%E5%B9%B6%E6%8C%82%E8%BD%BD%E5%88%B0%E7%BB%84%E4%BB%B6)。

### 监听状态改变

#### 监听与解除监听

```javascript
const subscription = store.observe().subscribe((state) => {
  console.log(state);
}); // 监听state改变

subscription.unsubscribe(); // 解除监听
```

`observe`实例方法返回一个**Observable**对象，关于Observable对象的细节可查阅[rxjs文档](https://cn.rx.js.org/manual/overview.html)。

#### 通过路径指定监听的目标

`observe`实例方法接受一个*listenPath*参数，类型为**Path**(string | string[])，代表需要监听的目标在整个状态对象中的路径，用于指示监听的范围；例如`store.observe('a[0].b.c')`，即代表监听`state.a[0].b.c`的改变；如不传入参数，则监听整个state的变化。
**Path**既可以是string，也可以是string数组；当path为string时，即代表以`.`与`[]`的语义书写路径；当path为string数组时，代表以*path components*的语义书写路径，两者等效：

`'a[0].b.c'` = `['a', 0, 'b', 'c']`

```javascript
const subscription = store.observe('a[0].b.c').subscribe((c) => {
  console.log(c);
}); // 监听state.a[0].b.c改变

const subscription = store.observe(['a', 0, 'b', 'c']).subscribe((c) => {
  console.log(c);
}); // 等效写法
```

同样，在*TypeScript*中，`observe<T>`作为泛型方法，可以接受一个类型参数，指示监听值的类型信息。因为利用路径获得值具有动态性，所以TypeScript编译器无法自动推断监听值的准确类型，需要手动指定。

```typescript
const subscription = store.observe<number>('a[0].b.c').subscribe((c) => {
  console.log(c); // TypeScript编译器此时能知道c的类型为number
});
```

**注意:** 在监听使用结束后，需要执行`subscription.unsubscribe()`解除监听以释放资源。

`query`实例方法，接受一个*查询字符串*参数，监听在状态对象中使用JSONPath查询字符串检索出的结果。

```typescript
const subscription = store.query<Book>('$..book[?(@.price<10)]').subscribe((result) => {
  console.log(result.length, result); // 类型为Book[]，所有price小于10的Book对象
});
```

JSONPath具体语法与示例见相关[文档](https://github.com/JSONPath-Plus/JSONPath#syntax-through-examples)。

#### 在React项目中

rx-immer-react提供了自定义hooks更简单地绑定状态到组件的state。并且，在React组件卸载时，绑定的监听也会自动解除。具体请参阅[rx-immer-react项目文档](https://github.com/NinjaSlayerSang/rx-immer-react#%E5%B0%86%E7%8A%B6%E6%80%81%E7%BB%91%E5%AE%9A%E5%88%B0%E7%BB%84%E4%BB%B6)。

### 直接获取状态值

```typescript
const state = store.value();

const c = store.value<number>('a[0].b.c');
```

`find`实例方法，接受一个*查询字符串*参数，返回在状态对象中使用JSONPath查询字符串检索出的结果集合。

```typescript
const result = store.find<Book>('$..book[?(@.price<10)]'); // 类型为Book[]，所有price小于10的Book对象
```

JSONPath具体语法与示例见相关[文档](https://github.com/JSONPath-Plus/JSONPath#syntax-through-examples)。

### 修改状态

```javascript
store.commit((state) => {
  state.name = 'new name';
});
```

rx-immer实例修改状态是通过提交事务的方式进行的，`commit`方法接受一个自定义的*recipe*函数，函数将被传入一份状态值的*代理*；在函数内所有对于state的直接操作（对象增加、删除、修改字段，数组增加、删除、修改元素等等）会被自动记录在事务当中，并在函数返回之后提交修改，更新实例的状态值，并通知相关的监听。

`commit`方法可以接受第二个参数*targetPath*，即需要修改的目标在整个状态对象中的路径，用于指示修改的范围：

```javascript
store.commit((b) => {
  b.c = 1;
}, 'a[0].b');
```

**注意:** 所有赋值操作前**不能**对代理对象**解引用**：

```javascript
store.commit((c) => {
  c = 1; // 错误！c为值类型，无法捕获修改！
}, 'a[0].b.c');

store.commit((b) => {
  let { c } = b;
  c = 1; // 错误！解引用，无法捕获修改！
}, 'a[0].b');
```

但是，只要变量指向的是引用类型，依然可以捕获修改：

```javascript
store.commit((a0) => {
  const { b } = a0;
  b.c = 1; // 正确！因为变量b指向一个引用对象
}, 'a[0]');
```

一般规律是，在编写*recipe*函数体时，如果需要对代理对象内部属性解引用，请使用`const`关键字以保证变量的不可变性。并且，如果项目使用*eslint*作为代码校验工具，可开启*no-param-reassign*规则禁止对函数参数再赋值，消除不恰当的代码可能造成的问题。

同样，在*TypeScript*中，`commit<T>`作为泛型方法，可以接受一个类型参数，指示修改目标的类型信息。

commit方法接受一个返回值，代表直接修改路径指向的数据。注意保证上层路径指向一个引用类型，否则会抛出错误。

```javascript
store.commit((c) => {
  return c + 1;
}, 'a[0].b.c');
```

在不指定路径时，即对顶层state进行修改时，也可以返回值，此时将直接修改整个state。注意，对顶层state的一次commit中，要么对传入的state代理进行修改，要么返回一个新的state值，不能先进行修改，然后返回一个新的state值（使用返回值给出一个新的状态意味着之前所有的修改均无效，immer框架为避免歧义，在这种场景下会抛出错误）。

```javascript
store.commit((state) => {
  state.a[0].b.c = 1; // 允许，只对代理进行修改
});

store.commit(() => {
  return { a: [{ b: { c: 1 } }] }; // 允许，只返回了新的状态值
});

store.commit((state) => {
  state.a[0].b.c = 1;
  return { a: [{ b: { c: 1 } }] }; // 报错！既进行了修改，又返回了新的状态值
});
```

如果想要将该路径的值设为undefined，该如何操作？

```javascript
store.commit(() => {
  return undefined; // 这是无效的，因为无法判断函数是显式返回undefined或者隐式结束
});
```

为此，immer框架专门提供了一个特征的实例`nothing`，以显式的表示返回undefined值：

```javascript
import { nothing } from 'rx-immer';

store.commit(() => {
  return nothing; // 代表将state设为undefined(如在TypeScript中使用，state类型必须为可空类型T | undefined，否则会提示类型错误)
});
```

*高级：请保证recipe函数同步返回时便完成本次提交的所有修改，传入recipe函数的代理state**不应该**被**闭包**捕获，因为在recipe函数返回之后，对于state的任何修改都**不再会生效**。例如state被闭包捕获传入某个异步回调中，在异步调用发生时，recipe函数已经执行完毕，修改事务已经提交，此时对于state的修改将不再有效果。*

```javascript
api().then((res) => {
  store.commit((state) => {
    state.data = res.data;
  });
}); // 正确

store.commit((state) => {
  api().then((res) => {
    state.data = res.data;
  });
}); // 错误！state被传入异步回调中，修改无法生效！
```

*commitAsync方法可完成异步的修改。commitAsync接受的`recipe`是一个async function：*

```javascript
store.commitAsync(async (state) => {
  const res = await api();
  state.data = res.data;
});
```

*ps：未来版本会考虑将commit方法与commitAsync方法合并统一处理同步与异步recipe。*

### 创建子实例

可以通过`sub`方法创建实例的子实例：

```javascript
const subStore = store.sub('a[0].b');
```

子实例接受一个路径值，为该子实例相对于父实例的相对路径：

```javascript
store.observe('a[0].b.c');
subStore.observe('c'); // 两者等效

store.commit((b) => { b.c = 1; }, 'a[0].b');
subStore.commit((b) => { b.c = 1; }); // 两者等效
```

同时，子实例也能创建下一层的子实例：

```javascript
const subSubStore = subStore.sub('path');
```

子实例可以通过`sup`方法获得上一层的父实例：

```javascript
const store = subStore.sup();
```

也可以通过`root`方法获得最上层的根实例：

```javascript
const store = subSubStore.root();
```

通过isSub与path字段查询实例是否为子实例以及相对于父级的路径：

```javascript
store.isSub // boolean

store.path // eg: ['a', 0, 'b']
```

使用TypeScript时，实例与子实例之间有递归嵌套的泛型系统，可帮助编译器智能判定sup与root方法返回的上层实例的具体类型，与之对应的，需要在调用`sub<T>`方法产生子实例时显式指定子实例的状态类型T。

### 销毁实例

```javascript
store.destroy();
```

清理实例内部监听事件链，如果手动创建实例，请保证在实例生命周期结束时显式调用`destroy`方法。

## 在React项目中使用

rx-immer-react包含一系列扩展方便在React项目中使用rx-immer，具体请参阅[rx-immer-react项目文档](https://github.com/NinjaSlayerSang/rx-immer-react)。

## 扩展功能

rx-immer使用**高阶类(HOC)**实现**继承派生模式**以扩展功能，并且使用**工厂模式**在创建实例时**动态地**派生子类以加载扩展的功能。采用这种模式能够提升项目的扩展性，也方便使用者开发自己的高阶类自定义扩展功能。

项目内置了一些扩展功能，通过创建实例时使用对应的**插件**可以加载这些功能。

```typescript
import { create } from 'rx-immer';

const store = create<IState, Ext /* 插件类型扩展 */ >(initialState, [ /* 插件列表 */ ]);
```

### 操作记录栈

加载historyPlugin插件，能够实现状态修改的撤销/重做等时间漫游功能：

```javascript
import { create, historyPlugin, HistoryPluginExt } from 'rx-immer';

const store = create<any, HistoryPluginExt>({}, [ historyPlugin({ /* 配置项 */ }) ]); // 配置项可空

// historyPlugin配置项
interface HistoryConfig {
  capacity: number; // 操作栈最大容量
  bufferDebounce: number; // 合并短时间多个状态变更操作的时间阈值，单位毫秒(ms)
}

// historyPlugin默认配置
const DEFAULT_CONFIG_HISTORY: HistoryConfig = {
  capacity: Number.POSITIVE_INFINITY, // 默认操作栈容量无限制
  bufferDebounce: 0, // 默认时间阈值为0，即不合并短时间多个操作
};

const [undos, redos] = store.getRoamStatus();
// 获取操作记录栈信息: [当前可撤销步骤数, 当前可重做步骤数]

store.revert(); // 撤销

store.recover(); // 重做
```

### 历史归档及场景还原

rx-immer内置了一个实验性的扩展功能，能够记录下应用状态的**详细变更历史**并进行归档。这不同于操作记录栈功能，操作记录栈功能可以方便使用者在变更提交中时间漫游，撤销或重做操作；而开启详细变更历史记录功能后，实例将会存储每一次变更细节，即使是操作记录栈的撤销或重做，也会作为一次变更历史进行归档。
历史归档功能可以应用在一些交互页面，如*表单页*，利用历史归档功能详细记录用户对于表单的操作轨迹。

场景还原功能作为历史归档功能的配属，能够接收历史归档数据，就像放映机插入光碟一样，还原播放应用状态历史记录。

#### 历史归档

```javascript
import { create, diachronyPlugin, DiachronyPluginExt } from 'rx-immer';

const store = create<any, DiachronyPluginExt>({}, [ diachronyPlugin ]); // 配置开启历史归档功能

const size = store.size(); // 查询当前历史记录的长度
const size = store.useDiachronySize(); // 在React中，可将历史记录长度状态绑定到组件状态中，需要使用rx-immer-react包的DiachronyHooksPlugin插件

const diachrony = store.archive(); // 将当前历史记录归档返回，并重置内部历史记录表，开启下一段记录
```

历史归档信息格式：

```typescript
interface Diachrony<T extends Objectish> {
  anchor: Immutable<T>; // 初始状态
  anchorTimeStamp: number; // 初始状态时间戳
  flows: { // 变更历史
    uid: number; // 序列id
    timeStamp: number; // 时间戳
    patchesTuple: PatchesTuple; // 变更增量数据
  }[];
  destination: Immutable<T>; // 结束状态
  archiveTimeStamp: number; // 结束状态时间戳
}
```

*历史归档信息是以**增量**而非**全量**的方式来记录变更历史的，不会因为状态对象庞大而记录大量的冗余信息。*

#### 场景还原

需要在实例创建时指定开启场景还原模式，当开启场景还原模式后，实例的`commit`方法将不生效（实例切换为只读模式）。

```javascript
import { create, replayMode, ReplayModeExt } from 'rx-immer';

const store = create<any, ReplayModeExt>({}, [ replayMode ]); // 配置开启场景还原模式

store.timeRange$ // 流数据，当前播放的历史归档的起始结束时间戳，可以调用subscribe以监听变化

store.setDiachrony(diachrony); // 设置重播的历史归档数据

const keyFrames = store.getKeyframes(); // 获取重播历史的关键帧(发生变更历史的时间戳)

store.replay(timeStamp); // 将播放指针移动到某个时间戳
```

如果应用使用rx-immer框架管理状态，在绝大多数情况下，不需要对**项目的业务代码**进行任何修改，只需要将创建的实例切换到场景还原模式，便可以插入某个历史归档信息进行观看。

*在[演示项目](https://github.com/NinjaSlayerSang/demo-rx-immer)中有详细的使用演示，并且演示了如何使用rx-immer管理antd的表单组件状态：只需轻松添加两行代码即可将现有的antd表单组件纳入rx-immer框架管理，给表单添加用户操作撤销、重做，记录与重播用户表单操作轨迹的功能。*

### 添加事务

向rx-immer实例上注册事务，通常用于在实例初始化时添加常驻的监听事件。事务按照自定义的key管理，可手动停止，或者在实例destroy时自动停止。

```javascript
// 开启事务
const affairKey = store.startAffair(function() { // 如果在此处不使用箭头函数，则可以在函数体内通过this取到实例
  const subscription = this.observe().subscribe(() => {
    // ...监听逻辑
  });

  // 返回用于清理监听的闭包
  return () => {
    subscription.unsubscribe();
  }
}, 'custom affair key'); // 可提供一个自定义的事务唯一key，用于关闭或重启事务(再次添加相同key的事务时会自动停止上一次)；
// 如不指定key，则会自动产生一个递增的key；key会作为startAffair方法的返回值。

store.stopAffair(affairKey); // 按照事务key停止事务，返回一个布尔值，是否成功停止

if (store.hasAffair(affairKey)) { /* ... */ } // 是否存在指定key的事务

const affairKeys = store.showAffairs(); // 获取所有运行中的事务key
```

## 工具函数

rx-immer封装了多个工具函数，帮助完成一些通用的功能：

```javascript
// 处理路径格式

trimPath('a[0].b.c') === ['a', 0, 'b', 'c']

assemblePath(['a', 0, 'b', 'c']) === 'a[0].b.c'

// 对象的深层更新

updateDeep(target, source) // 根据source对象递归地更新target，一般用在commit闭包中

store.commit((draft) => {
  updateDeep(draft, source); // 根据source中地实际结构与值更新state数据，自动依据各层的对象或数组结构对原数据增删改，并且只对增量进行修改
})
```

## F&Q

### 我该如何书写commit的recipe函数以完成对状态的更新？

immer框架提供了与mobx等框架相同的**直观式**更新状态对象的模式，在例如写入对象的属性值等场景下通俗而易于理解，但依旧会有不熟悉的使用者会在删除属性、修改数组等场景感到疑惑。
为了以最佳实践的使用相关功能，immer框架官方给出了[Update Patterns(更新模式)](https://immerjs.github.io/immer/update-patterns)范例。

### 只能在状态对象中包含原生Object，Array，Map与Set吗？是否能使用自定义的类？

答案是可以的。通过为自定义类添加[symbol属性](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol)`[immerable]`，可将自定义类纳入自动代理中：

```javascript
import { immerable } from "rx-immer";

class Foo {
    [immerable] = true; // 方式 1

    constructor() {
        this[immerable] = true; // 方式 2
    }
}

Foo[immerable] = true; // 方式 3
```

对象的具体行为模式参见[文档](https://immerjs.github.io/immer/complex-objects#semantics-in-detail)。
