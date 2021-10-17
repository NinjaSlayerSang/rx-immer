# rx-immer

基于不可变数据(immutable)与响应式数据流(observable)的JavaScript应用状态轻量级管理框架。

- [背景](#背景)
  - [不可变数据(immutable)](#不可变数据immutable)
  - [响应式数据流(observable)](#响应式数据流observable)
- [快速开始](#快速开始)
  - [在项目中引入](#在项目中引入)
  - [创建实例](#创建实例)
  - [监听状态改变](#监听状态改变)
  - [修改状态](#修改状态)
  - [销毁实例](#销毁实例)
- [在React中使用](#在react中使用)
  - [创建实例](#创建实例-1)
  - [将状态绑定到组件](#将状态绑定到组件)
- [扩展功能](#扩展功能)
  - [操作记录栈](#操作记录栈)
  - [历史归档及场景还原](#历史归档及场景还原)
    - [历史归档](#历史归档)
    - [场景还原](#场景还原)
- [配置](#配置)

## 背景

### 不可变数据(immutable)

使用[immer.js](https://immerjs.github.io/immer/)库维护应用状态对象的不可变性以及跟踪状态修改的增量信息。
immer能够保持JavaScript可序列化对象的不可变性，当嵌套的对象树的深层属性值发生改变时，能够自动新建对象来记录修改，而不影响到旧有的对象。对于树状结构中未修改的对象则复用旧对象的引用来优化性能（区别于深拷贝，极大地避免内存浪费）。

### 响应式数据流(observable)

使用[rxjs](https://rxjs.dev/)库构建用于通知订阅模式的可观察对象observable，用于分发能够应用状态改变的消息。rxjs是主流的响应式编程框架ReactiveX在JavaScript平台的版本，融合了通知订阅模式、迭代器模式、异步调度、函数式编程等多种范式，其特有的操作符能够让开发者方便地利用函数式编程范式解决复杂地业务逻辑，为程序带来良好的扩展性、低耦合性、易调试性等。

## 快速开始

rx-immer具有非常简易实用的基础功能API，使用者不需要关注任何额外的细节或者编程模式，创建、读取、修改、销毁，均可以一个接口一行代码轻松搞定，灵活便捷。

### 在项目中引入

```bash
npm install rx-immer --save
```

### 创建实例

```javascript
import { factory } from 'rx-immer';

const store = new (factory())({});
```

rx-immer使用**工厂模式**创建实例，`factory`函数为类工厂，可接受配置项参数，返回被配置的类，即可使用`new`关键字构建实例。构造函数接受一个**可序列化**的对象（例如Object、Array、Map、Set，可多层嵌套）参数，作为实例的初始状态值。

在*TypeScript*中，`factory<T>`作为泛型函数，能够显式地指定类型，指示状态值的类型信息：

```typescript
import { factory } from 'rx-immer';

interface IState {
  id: number;
  name: string;
  status: boolean;
}

const CustomRxImmer = factory<IState>(); // 不传入配置项参数，使用默认配置

const store = new CustomRxImmer({ id: 0, name: 'abc', status: true });
```

在*React*中使用时，可以利用内置的自定义hooks更简单地创建实例。具体用法将在后面的章节中介绍。

### 监听状态改变

```javascript
const subscription = store.observe().subscribe((state) => {
  console.log(state);
}); // 监听state改变

subscription.unsubscribe(); // 解除监听
```

`observe`实例方法返回一个**Observable**对象，关于Observable对象的细节可查阅[rxjs文档](https://cn.rx.js.org/manual/overview.html)。

`observe`实例方法接受一个*listenPath*参数，类型为**Path**(string | string[])，代表需要监听的目标在整个状态对象中的路径，用于指示监听的范围；例如`store.observe('a[0].b.c')`，即代表监听`state.a[0].b.c`的改变；如不传入参数，则监听整个state的变化。
**Path**既可以是string，也可以是string数组；当path为string时，即代表以`.`与`[]`的语义书写路径；当path为string数组时，代表以*path components*的语义书写路径，两者等效：

`a[0].b.c` = `['a', 0, 'b', 'c']`

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

**注意：**在监听使用结束后，需要执行`subscription.unsubscribe()`解除监听以释放资源。

在*React*中使用时，可以利用内置的自定义hooks更简单地绑定状态到组件的state，并且，在React组件卸载时，绑定的监听也会自动解除。具体用法将在后面的章节中介绍。

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

**注意：***targetPath*所指向的值必须是**引用类型**（如Object、Array），并且所有赋值操作前**不能**对代理对象**解引用**：

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

### 销毁实例

```javascript
store.destroy();
```

清理实例内部监听事件链，如果手动创建实例，请保证在实例生命周期结束时显式调用`destroy`方法。

## 在React中使用

框架内置了自定义hooks方便在React项目中更加便捷地使用rx-immer：

### 创建实例

```javascript
const store = useRxImmer({});
```

内部使用了*useRef*来创建并挂载实例，并且在React组件卸载时自动调用实例的`destroy`方法。

在TypeScript中，`useRxImmer<T>`作为泛型函数，能够显式地指定类型，指示状态值的类型信息。
并且，`useRxImmer`接受第一个参数，作为状态的初始值，可选地接受第二个参数*config*，作为实例创建的配置项。

```typescript
import { useRxImmer } from 'rx-immer';

interface IState {
  id: number;
  name: string;
  status: boolean;
}

// 在React组件中...

const store = useRxImmer<IState>(
    { id: 0, name: 'abc', status: true }, // 初始状态
    { history: { capacity: 1000 } }, // 配置项
  );
```

配置项详情将在后面的章节中介绍。

### 将状态绑定到组件

```javascript
const state = store.useBind();
const c = store.useBind('a[0].b.c');
```

内部使用*useState*将rx-immer实例状态与组件状态相绑定，当实例state发生改变，相关的所有组件将重新渲染（且只有改动影响到的组件会发生重新渲染）。组件卸载后，绑定的监听将会自动解除。

同样，在TypeScript中，`useBind<T>`作为实例的泛型方法，能够显式地指定类型，指示监听目标的类型信息。

```typescript
const c = store.useBind<number>('a[0].b.c');
// TypeScript编译器此时能知道c的类型为number
```

*注意：useBind等注入到实例方法中的自定义hooks会通过Mixin模式依据配置动态注入，注入过程发生在useRxImmer中。因此，只有通过useRxImmer创建的实例会自动含有内联的自定义hooks，如果通过其他方式创建，则需要手动注入hooks：*

```javascript
import { injectUseBind } from 'rx-immer';

// 不通过useRxImmer创建实例store...

const storeWithUseBind = injectUseBind(store);
```

## 扩展功能

rx-immer使用**高阶类(HOC)**实现**继承派生模式**以扩展功能，并且使用**工厂模式**在创建实例时**动态地**派生子类以加载扩展的功能。采用这种模式能够提升项目的扩展性，也方便使用者开发自己的高阶类自定义扩展功能。

项目内置了一些扩展功能，通过配置项可以加载这些功能并使用。

### 操作记录栈

rx-immer默认配置开启操作记录栈，能够实现状态修改的撤销/重做等时间漫游功能：

```javascript
const [undos, redos] = store.getRoamStatus?.() ?? [0, 0];
// 获取操作记录栈信息: [当前可撤销步骤数, 当前可重做步骤数]

store.revert?.(); // 撤销

store.recover?.(); // 重做
```

> - Q：为什么要使用`?.`操作符？
> - A：扩展功能是根据配置项动态加载的，当相关配置项指定为关闭时，扩展功能不会加载，此时实例相关功能的方法是空值。对于TypeScript编译器来说，因为配置项具有动态性，是无法准确推断实例的具体派生类型，此时将扩展功能的方法指定为可空类型是一个安全的实践。

在*React*中，可以利用扩展功能附带的自定义hooks将操作记录栈状态信息绑定到组件state中：

```javascript
const [undos, redos] = store.useRoamStatus?.() ?? [0, 0];
```

*同样的，useRoamStatus这个内联到实例内部的自定义hooks是在useRxImmer中动态注入到实例方法中的，只有通过useRxImmer创建的实例会依据配置项中是否开启相关扩展功能可选地包含自定义hooks。*

### 历史归档及场景还原

rx-immer内置了一个实验性的扩展功能，能够记录下应用状态的**详细变更历史**并进行归档。这不同于操作记录栈功能，操作记录栈功能可以方便使用者在变更提交中时间漫游，撤销或重做操作；而开启详细变更历史记录功能后，实例将会存储每一次变更细节，即使是操作记录栈的撤销或重做，也会作为一次变更历史进行归档。
历史归档功能可以应用在一些交互页面，如*表单页*，利用历史归档功能详细记录用户对于表单的操作轨迹。

场景还原功能作为历史归档功能的配属，能够接收历史归档数据，就像放映机插入光碟一样，还原播放应用状态历史记录。

历史归档及场景还原功能默认配置**不开启**。

#### 历史归档

```javascript
const store = useRxImmer({}, { diachrony: true }); // 配置开启历史归档功能

const size = store.size?.(); // 查询当前历史记录的长度
const size = store.useDiachronySize?.() // 在React中，可将历史记录长度状态绑定到组件状态中

const diachrony = store.archive?.(); // 将当前历史记录归档返回，并重置内部历史记录表，开启下一段记录
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

需要在实例创建时指定开启场景还原模式，当开启场景还原模式后，内置的其他扩展功能将自动关闭。
并且，实例的`commit`方法也将不生效（实例切换为只读模式）。

```javascript
const store = useRxImmer({}, { replay: true }); // 配置开启场景还原模式

store.timeRange$ // 流数据，当前播放的历史归档的起始结束时间戳，可以调用subscribe以监听变化

store.setDiachrony?.(diachrony); // 设置重播的历史归档数据

const keyFrames = store.getKeyframes?.(); // 获取重播历史的关键帧(发生变更历史的时间戳)

store.replay?.(timeStamp); // 将播放指针移动到某个时间戳
```

如果应用使用rx-immer框架管理状态，在绝大多数情况下，不需要对**项目的业务代码**进行任何修改，只需要将创建的实例切换到场景还原模式，便可以插入某个历史归档信息进行观看。

*在example演示项目中有详细的使用演示，并且演示了如何使用rx-immer管理antd的表单组件状态：只需轻松添加两行代码即可将现有的antd表单组件纳入rx-immer框架管理，给表单添加用户操作撤销、重做，记录与重播用户表单操作轨迹的功能。*

## 配置

```typescript
// 默认配置及配置详解
interface Config {
  history: // 操作栈功能配置，设置为false时关闭操作栈功能
    | {
        capacity: number; // 操作栈最大容量
        bufferDebounce: number; // 合并短时间多个状态变更操作的时间阈值
      }
    | false;
  diachrony: boolean; // 是否开启历史记录归档功能
  replay: boolean; // 是否开启场景还原模式
}

const defaultConfig: Config = {
  history: { // 默认开启操作栈功能
    capacity: Number.POSITIVE_INFINITY, // 默认操作栈容量无限制
    bufferDebounce: 0, // 默认时间阈值为0，即不合并短时间多个操作
  },
  diachrony: false, // 默认关闭历史记录归档功能
  replay: false, // 默认关闭场景还原模式
};
```
