# react-dom中创建的一系列玩意

## ReactDOM.render
``` js
ReactDOM.render(<APP />, document.getElementById('root')
```
这句代码应该写过React的人都不会陌生。。。。
在源码中render()的流程
``` js
  render(
    element: React$Element<any>,
    container: DOMContainer,
    callback: ?Function,
  ) {
    return legacyRenderSubtreeIntoContainer(
      null,
      element,
      container,
      false,
      callback,
    );
```
render源码很简单 element、container都知道是什么意思的，至于callback暂时还没用到过
``` js
function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>,
  children: ReactNodeList,
  container: DOMContainer,
  forceHydrate: boolean,
  callback: ?Function,
) {
  let root: Root = (container._reactRootContainer: any);
  if (!root) {
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
    );
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(root._internalRoot);
        originalCallback.call(instance);
      };
    }
    unbatchedUpdates(() => {
      if (parentComponent != null) {
        root.legacy_renderSubtreeIntoContainer(
          parentComponent,
          children,
          callback,
        );
      } else {
        root.render(children, callback);
      }
    });
  } else {
    //先省略这部分源码
  }
  return getPublicRootInstance(root._internalRoot);
}
```
legacyRenderSubtreeIntoContainer函数其实也不难。感觉react源码最麻烦的一点就是里面方法疯狂调用。阅读源码的时候会经常搞混不知道已经看到哪里了。。。。。。。

render中调用了这个函数，这五个参数的意义很明显。其中forceHydrate已经固定为false了。可以理解是否需要保留container中已经存在的一些元素。从renact-dom.render中调用的为false即不保留。如果是服务端渲染的话。值为true

let root: Root = (container._reactRootContainer: any); container是一开始通过document.getElement()获取的原生dom元素此时是肯定没有_reactRootContainer这个属性的。所以react会通过
``` js
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
    );
```
来创建这个属性
``` js
function shouldHydrateDueToLegacyHeuristic(container) {
  const rootElement = getReactRootElementInContainer(container);
  return !!(
    rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME)
  );
}
function legacyCreateRootFromDOMContainer(
  container: DOMContainer,
  forceHydrate: boolean,
): Root {
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
  if (!shouldHydrate) {
    let warned = false;
    let rootSibling;
    while ((rootSibling = container.lastChild)) {
      container.removeChild(rootSibling);
    }
  }
  const isConcurrent = false;
  return new ReactRoot(container, isConcurrent, shouldHydrate);
}
```
legacyCreateRootFromDOMContainer方法源码如上 shouldHydrate只是通过一些列判断是否需要保留container中原有的内容。需要保留的条件：

1、服务端渲染 

2、这是一个react元素生成的dom节点

符合一个就保留

初始化render的时候肯定都为false所以会移除掉所有的原有内容然后返回一个ReactRoot, isConcurrent表示是否为异步，此时为false

``` js
function ReactRoot(
  container: DOMContainer,
  isConcurrent: boolean,
  hydrate: boolean,
) {
  const root = createContainer(container, isConcurrent, hydrate);
  this._internalRoot = root;
}
export function createContainer(
  containerInfo: Container,
  isConcurrent: boolean,
  hydrate: boolean,
): OpaqueRoot {
  return createFiberRoot(containerInfo, isConcurrent, hydrate);
}
export function createFiberRoot(
  containerInfo: any,
  isConcurrent: boolean,
  hydrate: boolean,
): FiberRoot {
  const root: FiberRoot = (new FiberRootNode(containerInfo, hydrate): any);
  const uninitializedFiber = createHostRootFiber(isConcurrent);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  return root;
}
```
在 ReactRoot 构造函数内部就进行了一步操作，那就是创建了一个 FiberRoot 对象，并挂载到了 _internalRoot 上。和 DOM 树一样，fiber 也会构建出一个树结构（每个 DOM 节点一定对应着一个 fiber 对象），FiberRoot 就是整个 fiber 树的根节点,在 createFiberRoot 函数内部，分别创建了两个 root，一个 root 叫做 FiberRoot，另一个 root 叫做 RootFiber两者还是相互引用的。

stateNode 上文中已经讲过了，这里就不再赘述。

return、child、sibling 这三个属性很重要，它们是构成 fiber 树的主体数据结构。fiber 树其实是一个单链表树结构，return 及 child 分别对应着树的父子节点，并且父节点只有一个 child 指向它的第一个子节点，即便是父节点有很多子节点。每个子节点都有一个 sibling 属性指向着下一个子节点，都有一个 return 属性指向着父节点。

创建完root后再回到render方法
``` js
if (typeof callback === 'function') {
    const originalCallback = callback;
    callback = function() {
        const instance = getPublicRootInstance(root._internalRoot);
        originalCallback.call(instance);
    };
}
unbatchedUpdates(() => {
    if (parentComponent != null) {
        root.legacy_renderSubtreeIntoContainer(
          parentComponent,
          children,
          callback,
        );
    } else {
        root.render(children, callback);
    }
});
```
对callback进行封装？？？

root.legacy_renderSubtreeIntoContainer和root.render()这里面会创建很多的东西。但是这些东西基本都是调度相关的什么当前时间、过期时间、优先级什么的

## react-fiber-root
mark一下这个玩意
``` js
type BaseFiberRootProperties = {|
  // 容器，也就是 render 的第二个参数
  containerInfo: any,
  // 只在持续更新中使用
  pendingChildren: any,
  // 当前的 fiber 对象，也就是 root fiber
  current: Fiber,
  // 以下几种优先级是用来区分几种情况的
  // 1 未提交的 work
  // 2 未提交的 work 是暂停的
  // 3 未提交的 work 可能是没暂停的
  earliestSuspendedTime: ExpirationTime,
  latestSuspendedTime: ExpirationTime,
  //最老和最新的不确定是否会挂起的优先级（所有任务进来一开始都是这个状态）
  earliestPendingTime: ExpirationTime,
  latestPendingTime: ExpirationTime,
  // 最新的通过一个promise被reslove并且可以重新尝试的优先级
  latestPingedTime: ExpirationTime,

  pingCache:
    | WeakMap<Thenable, Set<ExpirationTime>>
    | Map<Thenable, Set<ExpirationTime>>
    | null,
  // 如果有错误被抛出并且没有更多的更新存在，我们尝试在处理错误前同步重新从头渲染
  // 在`renderRoot`出现无法处理的错误时会被设置为`true`
  didError: boolean,
  // 正在等待提交的任务的`expirationTime`
  pendingCommitExpirationTime: ExpirationTime,
  // 已经完成的任务的FiberRoot对象，如果你只有一个Root，那他永远只可能是这个Root对应的Fiber，或者是null
  // 在commit阶段只会处理这个值对应的任务
  finishedWork: Fiber | null,
  // 在任务被挂起的时候通过setTimeout设置的返回内容，用来下一次如果有新的任务挂起时清理还没触发的timeout
  timeoutHandle: TimeoutHandle | NoTimeout,
  // 顶层context对象，只有主动调用`renderSubtreeIntoContainer`时才会有用
  context: Object | null,
  pendingContext: Object | null,
  // 用来确定第一次渲染的时候是否需要融合
  +hydrate: boolean,
  // root 的剩余停止时间
  nextExpirationTimeToWorkOn: ExpirationTime,
  // 过期时间
  expirationTime: ExpirationTime,
  firstBatch: Batch | null,
  // root 的链表
  nextScheduledRoot: FiberRoot | null,
  // 几个新的字段
  callbackNode: *,
  callbackExpirationTime: ExpirationTime,
  firstPendingTime: ExpirationTime,
  lastPendingTime: ExpirationTime,
  pingTime: ExpirationTime,
|};
```
## react-fiber
mark一下这个玩意
``` js
export type Fiber = {|
  // 标记不同的组件类型 class ? function ? symbol?
  tag: WorkTag,

  // ReactElement里面的key
  key: null | string,

  // ReactElement.type，也就是我们调用`createElement`的第一个参数
  elementType: any,

  // The resolved function/class/ associated with this fiber.
  // 异步组件resolved之后返回的内容，一般是`function`或者`class`
  type: any,

  // The local state associated with this fiber.
  // 跟当前Fiber相关本地状态（比如浏览器环境就是DOM节点）
  stateNode: any,

  // 指向他在Fiber节点树中的`parent`，用来在处理完这个节点之后向上返回
  return: Fiber | null,

  // 单链表树结构
  // 指向自己的第一个子节点
  child: Fiber | null,
  // 指向自己的兄弟结构
  // 兄弟节点的return指向同一个父节点
  sibling: Fiber | null,
  index: number,

  // ref属性
  ref: null | (((handle: mixed) => void) & {_stringRef: ?string}) | RefObject,

  // 新的变动带来的新的props
  pendingProps: any, 
  // 上一次渲染完成之后的props
  memoizedProps: any,

  // 该Fiber对应的组件产生的Update会存放在这个队列里面
  updateQueue: UpdateQueue<any> | null,

  // 上一次渲染的时候的state
  memoizedState: any,

  // 一个列表，存放这个Fiber依赖的context
  firstContextDependency: ContextDependency<mixed> | null,

  // 用来描述当前Fiber和他子树的`Bitfield`
  // 共存的模式表示这个子树是否默认是异步渲染的
  // Fiber被创建的时候他会继承父Fiber
  // 其他的标识也可以在创建的时候被设置
  // 但是在创建之后不应该再被修改，特别是他的子Fiber创建之前
  mode: TypeOfMode,

  // Effect
  // 用来记录Side Effect
  effectTag: SideEffectTag,

  // 单链表用来快速查找下一个side effect
  nextEffect: Fiber | null,

  // 子树中第一个side effect
  firstEffect: Fiber | null,
  // 子树中最后一个side effect
  lastEffect: Fiber | null,

  // 代表任务在未来的哪个时间点应该被完成
  // 不包括他的子树产生的任务
  expirationTime: ExpirationTime,

  // 快速确定子树中是否有不在等待的变化
  childExpirationTime: ExpirationTime,

  // 在Fiber树更新的过程中，每个Fiber都会有一个跟其对应的Fiber
  // 我们称他为`current <==> workInProgress`
  // 在渲染完成之后他们会交换位置
  alternate: Fiber | null,

  // 下面是调试相关的，收集每个Fiber和子树渲染时间的

  actualDuration?: number,

  actualStartTime?: number,

  selfBaseDuration?: number,

  treeBaseDuration?: number,
  // __DEV__ only
  _debugID?: number,
  _debugSource?: Source | null,
  _debugOwner?: Fiber | null,
  _debugIsCurrentlyTiming?: boolean,
|};
```


