# 创建Fiber树
## demo
```js
import React, { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <h1
        onClick={() => {
          setCount(() => count + 1);
        }}
      >
        <p title={count}>{count}</p>
      </h1>
    </>
  );
}
```

react渲染的时候分为两个阶段，第一阶段称为render、第二阶段称为commit。render阶段主要工作是构建Fiber树和生成effectList。因为render阶段涉及代码有些多，所以先整理构建Fiber树相关的代码。比如以上的demo是如何创建Fiber树的

## 创建Fiber树过程(mount阶段)

在上面创建根节点末尾会看到已经形成了Fiber树的开始阶段，此时workInPoress(即Fiber双缓存中正在构建或更新的那颗树)还是不存在的。此时会创建workInProgess所对应的方法是createWorkInPoegress。

![](http://cybccc.com/prcture/3.png)

具体的是如何进入到这个方法的可以调试看代码执行栈。

![](http://cybccc.com/prcture/4.png)
```js
function createWorkInProgress(current, pendingProps) {
  var workInProgress = current.alternate;

  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key, current.mode);
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // ...
  }

  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue; // Clone the dependencies object. This is mutated 

  var currentDependencies = current.dependencies;
  workInProgress.dependencies = currentDependencies === null ? null : {
    lanes: currentDependencies.lanes,
    firstContext: currentDependencies.firstContext
  }; // These will be overridden during the parent's reconciliation

  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  {
    workInProgress.selfBaseDuration = current.selfBaseDuration;
    workInProgress.treeBaseDuration = current.treeBaseDuration;
  }

  {
    workInProgress._debugNeedsRemount = current._debugNeedsRemount;

    switch (workInProgress.tag) {
      case IndeterminateComponent:
      case FunctionComponent:
      case SimpleMemoComponent:
        workInProgress.type = resolveFunctionForHotReloading(current.type);
        break;

      case ClassComponent:
        workInProgress.type = resolveClassForHotReloading(current.type);
        break;

      case ForwardRef:
        workInProgress.type = resolveForwardRefForHotReloading(current.type);
        break;
    }
  }

  return workInProgress;
} // Used to reuse a Fiber for a second pass.
```
在mount阶段调用workInPoress就是一大堆很单纯的赋值操作，注意在createWorkInProgress的时候有这样两句代码
```js
    workInProgress.alternate = current;
    current.alternate = workInProgress;
```
这两句代码就是将current树和workInProgress相连。此时的Fiber树为
![](http://cybccc.com/prcture/5.png)

接着会循环调用performUnitOfwork来为workInProgress添加子节点。performUnitOfwork算是一个比较重要的函数了，日后再说。performUnitOfWork中又调用一系列方法调用reconcileChildren。就是这个方法为workInProgress创建子节点
```js
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderLanes);
  } else {
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderLanes);
  }
}
```
这里当初看的时候确实很懵，但是mountChildFibers和reconcileChildFibers真的是同一个方法
```js
  var reconcileChildFibers = ChildReconciler(true);
  var mountChildFibers = ChildReconciler(false);
```
大概就是这样。只是传参不同。具体在render阶段再说.而且最终会调用另一个reconcileChildFibers方法。这两个方法没有联系只是命名不同
```js
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild, lanes) {
    var isUnkeyedTopLevelFragment = typeof newChild === 'object' && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null;

    if (isUnkeyedTopLevelFragment) {
      newChild = newChild.props.children;
    } // Handle object types


    var isObject = typeof newChild === 'object' && newChild !== null;

    if (isObject) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes));

        case REACT_PORTAL_TYPE:
          return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, lanes));

        case REACT_LAZY_TYPE:
          {
            var payload = newChild._payload;
            var init = newChild._init; // TODO: This function is supposed to be non-recursive.

            return reconcileChildFibers(returnFiber, currentFirstChild, init(payload), lanes);
          }

      }
    }

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, lanes));
    }

    if (isArray$1(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes);
    }

    if (getIteratorFn(newChild)) {
      return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, lanes);
    }

    if (isObject) {
      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === 'function') {
        warnOnFunctionType(returnFiber);
      }
    }
    //...
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  return reconcileChildFibers;
}
```
这里会根据newChild也就是jsx的children类型来判断走哪个。具体都差不多比如reconcileSingleElement
```js

  function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
    var key = element.key;
    var child = currentFirstChild;

    while (child !== null) {
      // 此时child肯定为null的
    }

    if (element.type === REACT_FRAGMENT_TYPE) {
      var created = createFiberFromFragment(element.props.children, returnFiber.mode, lanes, element.key);
      created.return = returnFiber;
      return created;
    } else {
      var _created4 = createFiberFromElement(element, returnFiber.mode, lanes);

      _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
      _created4.return = returnFiber;
      return _created4;
    }
  }
  ```
  调用createFiberFromElement创建Fiber。同时用return指向了父节点
  ```js
  function createFiberFromElement(element, mode, lanes) {
  var owner = null;

  {
    owner = element._owner;
  }

  var type = element.type;
  var key = element.key;
  var pendingProps = element.props;
  var fiber = createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes);

  {
    fiber._debugSource = element._source;
    fiber._debugOwner = element._owner;
  }

  return fiber;
}
```
分离出type、key等值后调用createFiberFromTypeAndProps方法创建Fiber。这个方法顾名思义。其实内部也是调用createFiber方法具体日后再说。

在循环所有的子节点并创建Fiber。用child和return将所有Fiber节点相连后就能得到workInProgress。然后在commit阶段会有一句
```js
root.current = finishedWork;
```
将FiberRootNode的curreng指向WorkInProgress。至此Fiber树结构为
![](http://cybccc.com/prcture/7.png)

## 创建Fiber树过程(update阶段)
update阶段和mount阶段所调用的函数差不多。区别在于进入createWorkInProgress方法时。此时worrkInProgress不为null。会进入到else的逻辑
```js
function createWorkInProgress(current, pendingProps) {
  var workInProgress = current.alternate;

  if{
      //...
  } else {
    workInProgress.pendingProps = pendingProps; // Needed because Blocks store data on type.

    workInProgress.type = current.type; // We already have an alternate.
    workInProgress.flags = NoFlags; // The effect list is no longer valid.

    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    {
      workInProgress.actualDuration = 0;
      workInProgress.actualStartTime = -1;
    }
  }
  //...
  workInProgress.child = current.child;
  //...
  return workInProgress;
} // Used to reuse a Fiber for a second pass.
```
接着在进入reconcileSingleElement时child也不为null会进入到while的逻辑
```js
  function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
    var key = element.key;
    var child = currentFirstChild;

    while (child !== null) {
      if (child.key === key) {
        switch (child.tag) {
          case Fragment:
            {
              if (element.type === REACT_FRAGMENT_TYPE) {
                deleteRemainingChildren(returnFiber, child.sibling);
                var existing = useFiber(child, element.props.children);
                existing.return = returnFiber;

                {
                  existing._debugSource = element._source;
                  existing._debugOwner = element._owner;
                }

                return existing;
              }

              break;
            }

          case Block:
            {
              var type = element.type;

              if (type.$$typeof === REACT_LAZY_TYPE) {
                type = resolveLazyType(type);
              }

              if (type.$$typeof === REACT_BLOCK_TYPE) {
                if (type._render === child.type._render) {
                  deleteRemainingChildren(returnFiber, child.sibling);

                  var _existing2 = useFiber(child, element.props);

                  _existing2.type = type;
                  _existing2.return = returnFiber;

                  {
                    _existing2._debugSource = element._source;
                    _existing2._debugOwner = element._owner;
                  }

                  return _existing2;
                }
              }
            }

          default:
            {
              if (child.elementType === element.type || ( // Keep this check inline so it only runs on the false path:
               isCompatibleFamilyForHotReloading(child, element) )) {
                deleteRemainingChildren(returnFiber, child.sibling);

                var _existing3 = useFiber(child, element.props);

                _existing3.ref = coerceRef(returnFiber, child, element);
                _existing3.return = returnFiber;

                {
                  _existing3._debugSource = element._source;
                  _existing3._debugOwner = element._owner;
                }

                return _existing3;
              }

              break;
            }
        } // Didn't match.


        deleteRemainingChildren(returnFiber, child);
        break;
      } else {
        deleteChild(returnFiber, child);
      }

      child = child.sibling;
    }
    //...
  }
  ```
与mount阶段不同的是此时会调用useFiber克隆一个Fiber节点(只针对此demo具体更新和diff算法相关)。最后也会用这两句代码将workInProgress和current交换
```js
root.current = finishedWork;
```
最终形成的Fiber树如下

![](http://cybccc.com/prcture/8.png)