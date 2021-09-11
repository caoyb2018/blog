# diff算法
在创建Fiber树那一章提到过一个函数叫reconcileChildFibers。也简单的说了一下在update时这个函数根据当前的workInProgress克隆一个Fiber节点。这就是diff算法的过程

![](http://wx2.sinaimg.cn/bmiddle/006C7PHRly1g992amn1nzj304h05kglw.jpg)

## diff算法大致逻辑
diff算法有比较workInProgress和当前的current Fiber。有三个前提

1、只对比同级节点。跨层级节点不会进行复用

2、不同类型节点生成的dom树不同。此时会直接销毁

3、根据key对元素能否服用提供线索

```js
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild, lanes) {
    // This function is not recursive.
    // If the top level item is an array, we treat it as a set of children,
    // not as a fragment. Nested arrays on the other hand will be treated as
    // fragment nodes. Recursion happens at the normal flow.
    // Handle top level unkeyed fragments as if they were arrays.
    // This leads to an ambiguity between <>{[...]}</> and <>...</>.
    // We treat the ambiguous cases above the same.
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
          //...
        case REACT_LAZY_TYPE:
          //...

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

    if (typeof newChild === 'undefined' && !isUnkeyedTopLevelFragment) {
      // If the new child is undefined, and the return fiber is a composite
      // component, throw an error. If Fiber return types are disabled,
      // we already threw above.
      switch (returnFiber.tag) {
        case ClassComponent:
          {
            {
              var instance = returnFiber.stateNode;

              if (instance.render._isMockFunction) {
                // We allow auto-mocks to proceed as if they're returning null.
                break;
              }
            }
          }
        // Intentionally fall through to the next case, which handles both
        // functions and classes
        // eslint-disable-next-lined no-fallthrough

        case Block:
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent:
          {
            {
              {
                throw Error( (getComponentName(returnFiber.type) || 'Component') + "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null." );
              }
            }
          }
      }
    } // Remaining cases are all treated as empty.


    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }
  ```
  react会根据当前workInProgress类型比如object，array等(实际上就是单节点或者多节点)来判断走哪个逻辑

  ## 单节点对比
  单节点对比主要发生在reconcileSingleElement函数
  ```js
    function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
    var key = element.key;
    var child = currentFirstChild;

    while (child !== null) {//遍历同时也是判断是mount还是update
      if (child.key === key) { // key相同
        switch (child.tag) {
          case Fragment:
            //...

          case Block:
            //...
          default:
            {
              if (child.elementType === element.type || ( 
               isCompatibleFamilyForHotReloading(child, element) )) {
                deleteRemainingChildren(returnFiber, child.sibling); //删除父节点剩下的子节点。
                //也就是删除自己的兄弟节点
                var _existing3 = useFiber(child, element.props); // 这个函数只有几行代码。
                //就是根据当前节点克隆一个节点
                _existing3.ref = coerceRef(returnFiber, child, element);
                _existing3.return = returnFiber;

                return _existing3;
              }

              break;
            }
        } // Didn't match.


        deleteRemainingChildren(returnFiber, child);
        break;
      } else { // key不相同
        deleteChild(returnFiber, child);
      }

      child = child.sibling;
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
  注意所谓的单节点对比并不一定是指新老节点都是单节点。单节点对比发生的情况仅仅是指新节点是单节点。。

  单节点对比首先是个while循环，循环老节点的所有兄弟节点，遍历过程如下

  1. 节点key与新节点key相同
      + 该节点与新节点type相同

      表示该节点可复用。通过useFiber方法复制一个节点。并调用deleteRemainingChildren方法删除剩余兄弟节点
      + 该节点与新节点type不同

      表示该节点不可复用，继续遍历


  2. 节点key与新节点key不同

  调用deleteChild方法删除该节点，继续遍历

## 多节点对比
多节点对比情况比单节点要复杂一样。差不多分了三种情况
1. 节点更新(type、key、props等变化)
2. 新增节点
3. 删除节点
```js
function reconcileChildrenArray(
    returnFiber: Fiber,//父fiber节点
    currentFirstChild: Fiber | null,//childs中第一个节点
    newChildren: Array<*>,//新节点数组 也就是jsx数组
    lanes: Lanes,//lane相关 第12章介绍
  ): Fiber | null {

    let resultingFirstChild: Fiber | null = null;//diff之后返回的第一个节点
    let previousNewFiber: Fiber | null = null;//新节点中上次对比过的节点

    let oldFiber = currentFirstChild;//正在对比的oldFiber
    let lastPlacedIndex = 0;//上次可复用的节点位置 或者oldFiber的位置
    let newIdx = 0;//新节点中对比到了的位置
    let nextOldFiber = null;//正在对比的oldFiber
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {//第一次遍历
      if (oldFiber.index > newIdx) {//nextOldFiber赋值
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      const newFiber = updateSlot(//更新节点，如果key不同则newFiber=null
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        lanes,
      );
      if (newFiber === null) {
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;//跳出第一次遍历
      }
      if (shouldTrackSideEffects) {//检查shouldTrackSideEffects
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);//标记节点插入
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);//将oldFiber中没遍历完的节点标记为DELETION
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {//第2次遍历
        const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);//插入新增节点
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    // 将剩下的oldFiber加入map中
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    for (; newIdx < newChildren.length; newIdx++) {//第三次循环 处理节点移动
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        lanes,
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            existingChildren.delete(//删除找到的节点
              newFiber.key === null ? newIdx : newFiber.key,
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);//标记为插入的逻辑
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    if (shouldTrackSideEffects) {
      //删除existingChildren中剩下的节点
      existingChildren.forEach(child => deleteChild(returnFiber, child));
    }

    return resultingFirstChild;
  }
  ```
  + 第一次遍历 因为老的节点存在于current Fiber中，所以它是个链表结构，还记得Fiber双缓存结构嘛，节点通过child、return、sibling连接，而newChildren存在于jsx当中，所以遍历对比的时候，首先让newChildren[i]与oldFiber对比，然后让i++、nextOldFiber = oldFiber.sibling。在第一轮遍历中，会处理三种情况，其中第1，2两种情况会结束第一次循环
  1. key不同，第一次循环结束
  2. newChildren或者oldFiber遍历完，第一次循环结束
  3. key同type不同，标记oldFiber为DELETION
  4. key相同type相同则可以复用

newChildren遍历完，oldFiber没遍历完，在第一次遍历完成之后将oldFiber中没遍历完的节点标记为DELETION，即删除的DELETION Tag
 + 第二个遍历考虑三种情况
 1. newChildren和oldFiber都遍历完：多节点diff过程结束
 2. newChildren没遍历完，oldFiber遍历完，将剩下的newChildren的节点标记为Placement，即插入的Tag
 3. newChildren和oldFiber没遍历完，则进入节点移动的逻辑
 + 第三个遍历 主要逻辑在placeChild函数中
 ```js
 function placeChild(newFiber, lastPlacedIndex, newIndex) {
       newFiber.index = newIndex;
   
       if (!shouldTrackSideEffects) {
         return lastPlacedIndex;
       }
   
    var current = newFiber.alternate;
 
       if (current !== null) {
         var oldIndex = current.index;
   
         if (oldIndex < lastPlacedIndex) {
           //oldIndex小于lastPlacedIndex的位置 则将节点插入到最后
           newFiber.flags = Placement;
           return lastPlacedIndex;
         } else {
           return oldIndex;//不需要移动 lastPlacedIndex = oldIndex;
         }
       } else {
         //新增插入
         newFiber.flags = Placement;
         return lastPlacedIndex;
       }
     }
     ```