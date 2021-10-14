# rx-immer
基于不可变数据(immutable)与响应式数据流(observable)的JavaScript应用状态轻量级管理框架

----------
[TOC]
## 背景
### 不可变数据(immutable)
使用[immer.js](https://immerjs.github.io/immer/)库维护应用状态对象的不可变性以及跟踪状态修改的增量信息。
immer能够保持JavaScript可序列化对象的不可变性，当嵌套的对象树的深层属性值发生改变时，能够自动新建对象来记录修改，而不影响到旧有的对象。对于树状结构中未修改的对象则复用旧对象的引用来优化性能（区别于深拷贝，极大地避免内存浪费）。
### 响应式数据流(observable)
使用[rxjs](https://rxjs.dev/)库构建用于通知订阅模式的可观察对象observable，用于分发能够应用状态改变的消息。rxjs是主流的响应式编程框架ReactiveX在JavaScript平台的版本，融合了通知订阅模式、迭代器模式、异步调度、函数式编程等多种范式，其特有的操作符能够让开发者方便地利用函数式编程范式解决复杂地业务逻辑，为程序带来良好的扩展性、低耦合性、易调试性等。
## 快速开始
rx-immer具有非常简易实用的基础功能API，使用者不需要关注任何额外的细节或者编程模式，创建、读取、修改、销毁，均可以一个接口一行代码轻松搞定，灵活便捷。
- ### 创建实例
```javascript
import { factory } from 'rx-immer';

const store = new (factory())({});
```
rx-immer使用**工厂模式**创建实例，`factory`函数为类工厂，可接受配置项参数，返回被配置的类，即可使用`new`关键字构建实例。构造函数接受一个**可序列化**的对象（例如Object、Array、Map、Set，可多层嵌套）参数，作为`store`实例的初始状态值。

在*TypeScript*中，`factory<T>`作为泛型函数，能够显式地指定类型，指示状态值的类型信息：
```typescript
import { factory } from 'rx-immer';

interface IState {
  id: number;
  name: string;
  status: boolean;
}

const CustomRxImmer = factory<IState>();

const store = new CustomRxImmer({ id: 0, name: 'abc', status: true });
```
在*React*中使用时，可以利用内置的自定义hooks更简单地创建实例，将在后面的章节中介绍。
- ### 监听状态改变
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

在*React*中使用时，可以利用内置的自定义hooks更简单地绑定状态到组件的state，将在后面的章节中介绍。
- ### 修改状态
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
同样，在*TypeScript*中，`commit<T>`作为泛型方法，可以接受一个类型参数，指示修改目标的类型信息。

*高级：请保证recipe函数同步返回时便完成本次提交的所有修改，传入recipe函数的代理state**不应该**被**闭包**捕获，因为在recipe函数返回之后，对于state的任何修改都不再会生效。例如state被闭包捕获传入某个异步回调中，在异步调用发生时，recipe函数已经执行完毕，修改事务已经提交，此时对于state的修改将不再有效果*
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
- ### 销毁实例
```javascript
store.destroy()
```
清理所有监听事件
## 在React中使用
框架内置了自定义hooks方便在React项目中更加便捷地使用rx-immer：
- ### 创建实例
```javascript
const store = useRxImmer({});
```
内部使用了*useRef*来创建并挂载实例，并且在React组件卸载时自动调用`store.destroy()`清理实例。
- ### 将状态绑定到组件
```javascript
const state = store.useBind();
const c = store.useBind('a[0].b.c');
```
内部使用*useState*将rx-immer实例状态与组件状态相绑定，当实例state发生改变，相关的所有组件将重新渲染（且只有改动影响到的组件会发生重新渲染）。

*注意：useBind等注入到实例方法中的自定义hooks会通过Mixin模式依据配置动态注入，注入过程发生在useRxImmer()中，因此，只有通过useRxImmer创建的实例会自动含有内联的自定义hooks，如果通过其他方式创建，则需要手动注入hooks*
## 配置
todo
## 扩展功能
todo