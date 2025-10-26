# TanStack Table 架构与 React 命令式集成解析

## 仓库与包结构概览
TanStack Table 以 pnpm monorepo 管理，`packages/` 目录下包含 `table-core` 以及针对 React、Solid、Vue、Svelte 等框架的绑定，examples 目录则提供各框架的示例应用，形成“核心引擎 + 多框架适配层”的结构。整个仓库通过 `pnpm-workspace.yaml` 将这些包和示例纳入统一工作空间，便于共享构建配置与依赖。

## table-core：可扩展的表格引擎
`@tanstack/table-core` 承担了所有状态、派生数据和命令式能力，框架层只负责把状态与渲染系统连接。

### 实例化流程与选项融合
`createTable` 会把内建特性与用户通过 `_features` 追加的特性汇总成 `table._features`，再利用这些特性提供的 `getDefaultOptions` 叠加出默认配置。实例内部维护 `mergeOptions` 与 `setOptions`，在响应外界更新时始终以默认配置为基准合并用户配置；`setState` 则只是把状态更新委托给 `options.onStateChange`，真正的状态存取完全交给宿主框架。为了避免在渲染周期内重复执行昂贵计算，表实例还维护了一个微任务队列 `_queue`，延迟批量处理回调。

### 插件式特性系统
每个表特性都是一个实现 `TableFeature` 接口的对象。`createTable` 在实例化阶段遍历 `table._features`，依次触发 `getInitialState`、`getDefaultOptions` 和 `createTable`，从而让特性按需扩展实例 API 或默认状态。同样的生命周期还应用在行、列、单元格等结构体上：`createRow`/`createColumn` 在基本结构创建后再遍历特性，调用 `createRow`/`createColumn` 钩子注入能力，例如排序、分组或行选择标记。这种“核心骨架 + 特性注入”的模式把命令式 API 划分为多个可组合的插件。

### 派生模型与 memo 化
核心行、列、表等实体的大量 getter 都是通过 `memo` 工具封装的 memoized 计算，它会跟踪依赖数组并在依赖未变化时复用结果，同时结合 `getMemoOptions` 在调试模式下输出性能数据。行对象还维护 `_valuesCache`、`_uniqueValuesCache` 等缓存，配合列定义的 `accessorFn` 按需惰性取值。

### 状态共享工具
`makeStateUpdater` 是特性层更新状态的关键。它接收需要更新的状态键和表实例，返回一个 updater 包裹器，把局部状态更新转化为对 `table.setState` 的整体更新。各个特性在默认选项里把自己的 `onXXXChange` 指向该包装函数，实现“命令式方法更新局部状态 → 触发宿主框架的 onStateChange → 回写表实例状态”的闭环。

## React 绑定：把声明式使用桥接到命令式实例
`packages/react-table` 只导出了一个 `useReactTable` Hook 和辅助渲染方法。

### 表实例的生命周期管理
`useReactTable` 首次执行时通过 `React.useState` 创建一次 `createTable` 生成的实例，并把它保存在稳定的 `tableRef.current` 中，确保组件重新渲染时不会重新构造命令式对象。

### 状态编排与受控/非受控融合
Hook 内部维护一个本地 `state`，初始值来自 `table.initialState`。在每次渲染中，Hook 会调用 `table.setOptions` 重新合并用户选项：
- `state` 与 `options.state` 按优先级合并，允许使用者只控制部分状态；
- `onStateChange` 被包装成一个调用 `setState` 的函数，同时透传给用户传入的回调。

由于核心实例的 `setState` 只是转发到 `options.onStateChange`，这一步就把 React 的声明式状态更新（`setState`）转换成了命令式实例可感知的变更。反过来，特性通过 `makeStateUpdater` 注入的命令式 API（如 `table.setRowSelection`、`table.toggleAllRowsSelected`）会调用 `table.options.onRowSelectionChange`，最终触发 Hook 中的 `setState`，从而驱动组件重新渲染。

### 渲染辅助
`flexRender` 负责把列定义里声明式的 React 节点或组件转成可渲染的元素。它支持直接传入 ReactNode 或函数/类组件，并自动区分类组件、函数组件和 `memo`/`forwardRef` 等异形组件，保持命令式实例与 React 渲染树之间的松耦合。

## 将该范式迁移到其他场景的要点
1. **把核心逻辑抽象成命令式实例**：把状态、派生数据、操作都封装在框架无关的对象里，并提供扩展点让特性按需注入。
2. **把状态更新统一抽象成 `setState` → `onStateChange` 的闭环**：宿主框架负责提供 `onStateChange` 回调并在其中驱动自身的状态系统，实例只需调用即可。
3. **在框架层维护实例生命周期**：利用框架提供的稳定引用（React 的 `useState` 或 `useRef`）只创建一次实例，并在渲染阶段持续向它注入最新配置。
4. **用适配器把命令式结果还原为声明式视图**：类似 `flexRender` 的工具可以把纯数据或组件描述转换为目标框架的渲染树，从而保持渲染端依旧是声明式的。

掌握这一套分层范式，就可以在其他复杂组件中复制同样的模式：核心逻辑以命令式实例承载，框架绑定层负责在声明式生态中维持实例、同步状态和渲染。
