# 一系列时间和update
## 当root创建完成后
``` js
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
在前面创建完root后终于到了一系列更新和渲染的过程

unbatchedUpdates其实就是一个更新的函数在js中批量使用setState并不会有多次渲染

比如
``` js
// num 会变成 3，但实际上只有一次渲染
this.setState({ num: 1 })
this.setState({ num: 2 })
this.setState({ num: 3 })
```
这是因为内部会将这个三次 setState 合并为一次更新，术语是批量更新（batchedUpdate）

对于 root 来说其实没必要去批量更新，所以这里调用了 unbatchedUpdates 函数来告知内部不需要批量更新。

然后在 unbatchedUpdates 回调内部判断是否存在 parentComponent。root上面基本不会有parentComponment。不存在 parentComponent 的话就会执行 root.render
``` js
ReactRoot.prototype.render = function(
  children: ReactNodeList,
  callback: ?() => mixed,
): Work {
  const root = this._internalRoot;
  const work = new ReactWork();
  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    work.then(callback);
  }
  updateContainer(children, root, null, work._onCommit);
  return work;
};
export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function,
): ExpirationTime {
  const current = container.current;
  const currentTime = requestCurrentTime();
  const expirationTime = computeExpirationForFiber(currentTime, current);
  return updateContainerAtExpirationTime(
    element,
    container,
    parentComponent,
    expirationTime,
    callback,
  );
}
```
在 render 函数内部我们首先取出 root，这里的 root 指的是 FiberRoot。然后创建了 ReactWork 的实例，这块内容就是为了在组件渲染或更新后把所有传入 ReactDom.render 中的回调函数全部执行一遍。然后updateContainer()

先从 FiberRoot 的 current 属性中取出它的 fiber 对象，然后计算了两个时间。

## 时间计算
requestCurrentTime函数实际上真正计算时间的也就这么几句代码
``` js
function recomputeCurrentRendererTime() {
	const currentTimeMs = now() - originalStartTimeMs;
	currentRendererTime = msToExpirationTime(currentTimeMs);
}
const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = MAX_SIGNED_31_BIT_INT - 1;
export function msToExpirationTime(ms: number): ExpirationTime {
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}
```
now指当前时间，originalStartTimeMs 是 React 应用初始化时记录的时间，并且这个值不会在后期再被改变。那么这两个值相减以后，得到的结果也就是现在离 React 应用初始化时经过了多少时间。

expirationTime这个时间和优先级有关，值越大，优先级越高。并且同步是优先级最高的。

然后计算expirationTime，computeExpirationForFiber方法其实真正计算时间也一样只有几句代码

``` js
// 同步
expirationTime = Sync
// 交互事件，优先级较高
expirationTime = computeInteractiveExpiration(currentTime)
// 异步，优先级较低
expirationTime = computeAsyncExpiration(currentTime)
```
这两个方法的具体代码
``` js
const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = MAX_SIGNED_31_BIT_INT - 1;
function ceiling(num: number, precision: number): number {
  return (((num / precision) | 0) + 1) * precision;
}

function computeExpirationBucket(
  currentTime,
  expirationInMs,
  bucketSizeMs,
): ExpirationTime {
  return (
    MAGIC_NUMBER_OFFSET -
    ceiling(
      MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE,
    )
  );
}

export const LOW_PRIORITY_EXPIRATION = 5000;
export const LOW_PRIORITY_BATCH_SIZE = 250;

export function computeAsyncExpiration(
  currentTime: ExpirationTime,
): ExpirationTime {
  return computeExpirationBucket(
    currentTime,
    LOW_PRIORITY_EXPIRATION,
    LOW_PRIORITY_BATCH_SIZE,
  );
}
export const HIGH_PRIORITY_EXPIRATION = __DEV__ ? 500 : 150;
export const HIGH_PRIORITY_BATCH_SIZE = 100;

export function computeInteractiveExpiration(currentTime: ExpirationTime) {
  return computeExpirationBucket(
    currentTime,
    HIGH_PRIORITY_EXPIRATION,
    HIGH_PRIORITY_BATCH_SIZE,
  );
}

export function inferPriorityFromExpirationTime(
  currentTime: ExpirationTime,
  expirationTime: ExpirationTime,
): ReactPriorityLevel {
  if (expirationTime === Sync) {
    return ImmediatePriority;
  }
  if (expirationTime === Never) {
    return IdlePriority;
  }
  const msUntil =
    msToExpirationTime(expirationTime) - msToExpirationTime(currentTime);
  if (msUntil <= 0) {
    return ImmediatePriority;
  }
  if (msUntil <= HIGH_PRIORITY_EXPIRATION) {
    return UserBlockingPriority;
  }
  if (msUntil <= LOW_PRIORITY_EXPIRATION) {
    return NormalPriority;
  }
  return IdlePriority;
}
```
看上去很复杂实际上会js的小伙伴都能看懂

唯一需要注意的就是ceiling 函数中的 1 * bucketSizeMs / UNIT_SIZE 是为了抹平一段时间内的时间差，在抹平的时间差内不管有多少个任务需要执行，他们的过期时间都是同一个，以此来优化性能

## Queue
在计算完时间后进入updateContainerAtExpirationTime， 这个方法里面只需要注意scheduleRootUpdate这个函数就行
``` js
function scheduleRootUpdate(
  current: Fiber,
  element: ReactNodeList,
  expirationTime: ExpirationTime,
  callback: ?Function,
) {
  const update = createUpdate(expirationTime);
  update.payload = {element};

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    warningWithoutStack(
      typeof callback === 'function',
      'render(...): Expected the last optional `callback` argument to be a ' +
        'function. Instead received: %s.',
      callback,
    );
    update.callback = callback;
  }

  flushPassiveEffects();
  enqueueUpdate(current, update);
  scheduleWork(current, expirationTime);

  return expirationTime;
}
```
这里的update就是一个对象需要注意的是enqueueUpdate()方法这个方法就是一些列的队列操作
``` js
export function enqueueUpdate<State>(fiber: Fiber, update: Update<State>) {
  // Update queues are created lazily.
  // 获取 fiber 的镜像
  const alternate = fiber.alternate;
  let queue1;
  let queue2;
  // 第一次 render 的时候肯定是没有这个镜像的，所以进第一个条件
  if (alternate === null) {
    // There's only one fiber.
    // 一开始也没这个 queue，所以需要创建一次
    queue1 = fiber.updateQueue;
    queue2 = null;
    if (queue1 === null) {
      // UpdateQueue 是一个链表组成的队列
      queue1 = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
    }
  } else {
    queue1 = fiber.updateQueue;
    queue2 = alternate.updateQueue;
    // 以下就是在判断 q1、q2 存不存在了，不存在的话就赋值一遍
    // clone 的意义也是为了节省开销
    if (queue1 === null) {
      if (queue2 === null) {
        queue1 = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
        queue2 = alternate.updateQueue = createUpdateQueue(
          alternate.memoizedState,
        );
      } else {
        queue1 = fiber.updateQueue = cloneUpdateQueue(queue2);
      }
    } else {
      if (queue2 === null) {
        queue2 = alternate.updateQueue = cloneUpdateQueue(queue1);
      } else {
      }
    }
  }
  // 获取队列操作完毕以后，就开始入队了
  // 以下的代码很简单，熟悉链表的应该清楚链表添加一个节点的逻辑
  if (queue2 === null || queue1 === queue2) {
    appendUpdateToQueue(queue1, update);
  } else {
    if (queue1.lastUpdate === null || queue2.lastUpdate === null) {
      appendUpdateToQueue(queue1, update);
      appendUpdateToQueue(queue2, update);
    } else {
      appendUpdateToQueue(queue1, update);
      queue2.lastUpdate = update;
    }
  }
}
```
已经添加注释

对于 update 对象内部的属性来说，重点关注的是 next 属性。因为 update 其实就是一个队列中的节点，这个属性可以用于帮助我们寻找下一个 update。对于批量更新来说，我们可能会创建多个 update，因此我们需要将这些 update 串联并存储起来，在必要的时候拿出来用于更新 state。

在 render 的过程中其实也是一次更新的操作，但是我们并没有 setState，因此就把 payload 赋值为 {element} 了。

接下来我们将 callback 赋值给 update 的属性，这里的 callback 还是 ReactDom.render 的第三个参数。

然后我们将刚才创建出来的 update 对象插入队列中，enqueueUpdate 函数内部分支较多且代码简单，这里就不再贴出代码了，有兴趣的可以自行阅读。函数核心作用就是创建或者获取一个队列，然后把 update 对象入队。

最后调用 scheduleWork 函数