# render阶段
render阶段主要工作是构建Fiber树和生成effectList链表。而这个过程的起点就是performUnitOfWork函数。react通过循环调用这个函数来为每一个react element对象创建Fiber并通过retuen siblibg child来相连成Fiber树。
## leagcy和concurrent区别
leagcy模式和concurrent模式调用performUnitOfWork的方式有所不同
```js
// leagcy模式
function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```
```js
// concurrent模式
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```
在concurrent模式中会多了一个shouldYield判断当前需不需要暂停。这也就是所说的异步可中断的策略
```js
const frameYieldMs = 5;
let startTime = -1;
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }
}
```
shouldYieldToHost就是shouldYield函数。通过判断当前时间减去开始时间是否小于5ms(与设备刷新率有关？)来决定是否需要中断本次渲染
## performUnitOfWork大体流程
```js
function performUnitOfWork(unitOfWork) {
  var current = unitOfWork.alternate;
  var next;
  if ( (unitOfWork.mode & ProfileMode) !== NoMode) {
    next = beginWork$1(current, unitOfWork, subtreeRenderLanes);
  } else {
    next = beginWork$1(current, unitOfWork, subtreeRenderLanes);
  }
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}
```
```js
function completeUnitOfWork(unitOfWork) {
  var completedWork = unitOfWork;

  do {
    if ((completedWork.flags & Incomplete) === NoFlags) {
      var next = void 0;
      if ( (completedWork.mode & ProfileMode) === NoMode) {
        next = completeWork(current, completedWork, subtreeRenderLanes);
      } else {
        next = completeWork(current, completedWork, subtreeRenderLanes);
      }
      if (next !== null) {
        // Completing this fiber spawned new work. Work on that next.
        workInProgress = next;
        return;
      }
    } else {
     // ...
    }
    var siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    } // Otherwise, return to the parent
    completedWork = returnFiber; // Update the next thing we're working on in case something throws.
    workInProgress = completedWork;
  } while (completedWork !== null); // We've reached the root.
}
```
大体上的流程是一个深度优先遍历的过程从RootFiber开始执行beginWork然后顺着rootFiber.child一路向下为每一个子节点执行beginWork。当遍历到最后一个子节点时child为null就会为当前节点执行completeWork。completeWork会寻找该节点的兄弟节点，为兄弟节点执行beiginWork。同样也是一路向下，当遍历到最后一个兄弟节点的时候会一路向上寻找parent。为parent执行completeWork
大致的执行顺序如下
![](http://cybccc.com/prcture/9.png)
## beginWork
```js
function beginWork(current, workInProgress, renderLanes) {
  //current指workInProgress.alternate
  var updateLanes = workInProgress.lanes;
  if (current !== null) { // 更新状态走这个
    var oldProps = current.memoizedProps;
    var newProps = workInProgress.pendingProps;

    if (oldProps !== newProps || hasContextChanged() || (
     workInProgress.type !== current.type )) { // 判断能否服用条件1
      didReceiveUpdate = true;
    } else if (!includesSomeLane(renderLanes, updateLanes)) { // 判断能否复用条件2

      switch (workInProgress.tag) {
        case HostRoot:
          pushHostRootContext(workInProgress);
          resetHydrationState();
          break;

        case HostComponent:
          //...

        case ClassComponent:
          //...

        case HostPortal:
          //...

        case ContextProvider:
          //...

        case Profiler:
          //...
        //...
      }

      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    } else {
      if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        didReceiveUpdate = true;
      } else {
        didReceiveUpdate = false;
      }
    }
  } else {
    didReceiveUpdate = false;
  } 

  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {  // 渲染状态走这个
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    //...
  }
}
```
beginWork会通过workInProgress.alterinate是否为null来判断当前节点是处于首次渲染还是更新。

**更新状态**

判断节点能否复用。如果能服用则进入bailoutOnAlreadyFinishedWork逻辑。否则会根据workInProgress.tag进入相应的的逻辑最终会调用reconcileChildren创建Fiber节点这个在创建Fiber树那一节有

**渲染状态**

根据workInProgress.tag进入相应的的逻辑最终会调用reconcileChildren创建Fiber节点。这个在创建Fiber树那一节有

总结一下 beginWork主要阶段就是创建Fiber

## completeWork
```js
function completeWork(current, workInProgress, renderLanes) {
  var newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      return null;

    case ClassComponent:
      //...

    case HostRoot:
      //...

    case HostComponent:
      {
        popHostContext(workInProgress);
        var rootContainerInstance = getRootHostContainer();
        var type = workInProgress.type;

        if (current !== null && workInProgress.stateNode != null) { // 更新阶段
          updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance);

          if (current.ref !== workInProgress.ref) {
            markRef$1(workInProgress);
          }
        } else { // 首次渲染
          //...
          if (_wasHydrated) {
            //...
          } else {
            var instance = createInstance(type, newProps, rootContainerInstance, currentHostContext, workInProgress); // 创建dom实例
            appendAllChildren(instance, workInProgress, false, false); // 插入子元素
            workInProgress.stateNode = instance; // 赋值stateNode

            if (finalizeInitialChildren(instance, type, newProps, rootContainerInstance)) {//初始化dom属性
              markUpdate(workInProgress);
            }
          }

          if (workInProgress.ref !== null) {
            // If there is a ref on a host node we need to schedule a callback
            markRef$1(workInProgress);
          }
        }

        return null;
      }

    case HostText:
      //...

    case SuspenseComponent:
      //...

    case HostPortal:
      //...

    case ContextProvider:
      //...

    case IncompleteClassComponent:
      //...

    case SuspenseListComponent:
      //...

    case FundamentalComponent:
      //...

    case ScopeComponent:
      //...

    case Block:
      //...

    case OffscreenComponent:
    case LegacyHiddenComponent:
      //...
  }
}
```
completeWork同样根据workInProgress.tag进入不同的逻辑然后判断是首次渲染还是更新(已HostComponent为例)

**首次渲染**

首先调用createInstance创建对应的dom实例
```js
function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
  var parentNamespace;

  {
    // TODO: take namespace into account when validating.
    var hostContextDev = hostContext;
    validateDOMNesting(type, null, hostContextDev.ancestorInfo);

    if (typeof props.children === 'string' || typeof props.children === 'number') {
      var string = '' + props.children;
      var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type);
      validateDOMNesting(null, string, ownAncestorInfo);
    }

    parentNamespace = hostContextDev.namespace;
  }

  var domElement = createElement(type, props, rootContainerInstance, parentNamespace);//这个方法就是创建dom实例。有跟多原生的操作
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}
```
createInstance中会操作很多原生的document比如createElement
```js
function createElement(type, props, rootContainerElement, parentNamespace) {
  var isCustomComponentTag; // We create tags in the namespace of their parent container, except HTML
  // tags get no namespace.

  var ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
  var domElement;
  var namespaceURI = parentNamespace;

  if (namespaceURI === HTML_NAMESPACE$1) {
    namespaceURI = getIntrinsicNamespace(type);
  }

  if (namespaceURI === HTML_NAMESPACE$1) {
    {
      isCustomComponentTag = isCustomComponent(type, props); // Should this check be gated by parent namespace? Not sure we want to
      // allow <SVG> or <mATH>.

      if (!isCustomComponentTag && type !== type.toLowerCase()) {
        error('<%s /> is using incorrect casing. ' + 'Use PascalCase for React components, ' + 'or lowercase for HTML elements.', type);
      }
    }

    if (type === 'script') {
      // Create the script via .innerHTML so its "parser-inserted" flag is
      // set to true and it does not execute
      var div = ownerDocument.createElement('div');

      div.innerHTML = '<script><' + '/script>'; // eslint-disable-line
      // This is guaranteed to yield a script element.

      var firstChild = div.firstChild;
      domElement = div.removeChild(firstChild);
    } else if (typeof props.is === 'string') {
      // $FlowIssue `createElement` should be updated for Web Components
      domElement = ownerDocument.createElement(type, {
        is: props.is
      });
    } else {
      domElement = ownerDocument.createElement(type); // Normally attributes are assigned in 

      if (type === 'select') {
        var node = domElement;

        if (props.multiple) {
          node.multiple = true;
        } else if (props.size) {
          // Setting a size greater than 1 causes a select to behave like `multiple=true`, where
          // it is possible that no option is selected.
          //
          // This is only necessary when a select in "single selection mode".
          node.size = props.size;
        }
      }
    }
  } else {
    domElement = ownerDocument.createElementNS(namespaceURI, type);
  }

  {
    if (namespaceURI === HTML_NAMESPACE$1) {
      if (!isCustomComponentTag && Object.prototype.toString.call(domElement) === '[object HTMLUnknownElement]' && !Object.prototype.hasOwnProperty.call(warnedUnknownTags, type)) {
        warnedUnknownTags[type] = true;

        error('The tag <%s> is unrecognized in this browser. ' + 'If you meant to render a React component, start its name with ' + 'an uppercase letter.', type);
      }
    }
  }

  return domElement;
}
```
以及appendAllChildren，finalizeInitialChildren等也是一样的操作dom元素。具体代码就不贴了

**更新阶段**

更新阶段主要是调用updateHostComponent$1 方法。这个方法的主要目的是在当前节点的updateQueue也就是任务队列上初始化一个任务。然后提交commitRoot进入commit阶段
```js
  updateHostComponent$1 = function (current, workInProgress, type, newProps, rootContainerInstance) {
    // If we have an alternate, that means this is an update and we need to
    // schedule a side-effect to do the updates.
    var oldProps = current.memoizedProps;

    if (oldProps === newProps) {
      // In mutation mode, this is sufficient for a bailout because
      // we won't touch this node even if children changed.
      return;
    } // If we get updated because one of our children updated, we don't
    // have newProps so we'll have to reuse them.
    // TODO: Split the update API as separate for the props vs. children.
    // Even better would be if children weren't special cased at all tho.


    var instance = workInProgress.stateNode;
    var currentHostContext = getHostContext(); // TODO: Experiencing an error where oldProps is null. Suggests a host
    // component is hitting the resume path. Figure out why. Possibly
    // related to `hidden`.

    var updatePayload = prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, currentHostContext); // TODO: Type this specific to this type of component.

    workInProgress.updateQueue = updatePayload; // If the update payload indicates that there is a change or if there
    // is a new ref we mark this as an update. All the work is done in commitWork.

    if (updatePayload) {
      markUpdate(workInProgress);
    }
  };
  ```
  ![](http://wx4.sinaimg.cn/large/bf976b12gy1ga9fippx95g206606ljrp.gif)