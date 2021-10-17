# 演示项目

## 快速开始

### 安装依赖

首先手动安装rx-immer，然后安装package.json中的其他依赖：

```bash
npm install rx-immer
npm install
```

### 运行项目

```bash
npm start
```

## 注意

如果在npm源中找不到rx-immer库，可以使用本地调试npm包模式运行项目。

返回上一级目录，安装依赖并执行npm link：

```bash
cd ..
npm install
npm link
```

回到本级目录，执行npm link rx-immer，再安装依赖：

```bash
cd example
npm link rx-immer
npm install
```
