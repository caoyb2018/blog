# react暴露的api

如下

``` js
const React = {
  Children: {
    map,
    forEach,
    count,
    toArray,
    only,
  },

  createRef,
  Component,
  PureComponent,

  createContext,
  forwardRef,
  lazy,
  memo,

  error,
  warn,

  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useDebugValue,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,

  Fragment: REACT_FRAGMENT_TYPE,
  Profiler: REACT_PROFILER_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,
  Suspense: REACT_SUSPENSE_TYPE,

  createElement: __DEV__ ? createElementWithValidation : createElement,
  cloneElement: __DEV__ ? cloneElementWithValidation : cloneElement,
  createFactory: __DEV__ ? createFactoryWithValidation : createFactory,
  isValidElement: isValidElement,

  version: ReactVersion,

  unstable_ConcurrentMode: REACT_CONCURRENT_MODE_TYPE,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ReactSharedInternals,
};
```

## react.createElement
react.createElement可以说是react里面我们用到的最多的一个api了虽然我们并没有这种感觉，但实际上每次写jsx语法我们都会用到这个方法
``` js
render() {
    return (
        <div className={danger}>
            1111
        </div >
    )
}
```
如上是一段最简单的react代码，也是最简单的jsx语法，实际上这段代码会编译成这样一种形式的对象
``` js
    type: 'div',
    {
      className: 'danger'
    },
    children: [
        '111'
    ]
```
jsx会将html语法直接加入到js，再由翻译器转换成春js后由浏览器执行。React官方之前开发过一套轮子JSTransform来完成这个工作。但是现在已经全部用Babel的jsx编译器来实现了，而JSTransform这个轮子已经不再维护。

而Babel将jsx语法编译成这个形式后会将这个结果作为参数传递给React.createElement方法,react.CreateElement方法源码如下(加了一些注释)
``` js
export function createElement(type, config, children) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;
  // 判断是否传入配置，比如 <div className='11'></div> 中的 className 会被解析到配置中
  if (config != null) {
    // 验证 ref 和 key，只在开发环境下
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }
    // 赋值操作
    // self 呢就是为了以后正确获取 this
    // source 基本来说没啥用，内部有一些 filename, line number 这种
    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    // Remaining properties are added to a new props object
    // 遍历配置，把内建的几个属性剔除后丢到 props 中
    for (propName in config) {
      if (
        //lookhere
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  // 处理 children 的几个操作，很简单
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    if (__DEV__) {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // Resolve default props
  // 判断是否有给组件设置 defaultProps，有的话判断是否有给 props 赋值，只有当值为
  // undefined 时，才会设置默认值
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  if (__DEV__) {
    if (key || ref) {
      const displayName =
        typeof type === 'function'
          ? type.displayName || type.name || 'Unknown'
          : type;
      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }
      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}
```
createElement所做的事情如下

1、处理config即我们所传递的ref、id、className等

2、处理子元素

3、处理默认值

经过上述处理后会得到几个值type、key等这些值等含义应该不难理解,得到这几个值后会把这些值作为参数传递给 ReactElement方法，这个世纪上也只是一个工厂函数，源码如下
``` js
const ReactElement = function (type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner,
  };

  if (__DEV__) {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.

    //为了使ReactElement的比较更容易进行测试，我们使
    //验证标志不可枚举（在可能的情况下，应
    //包括我们在其中运行测试的所有环境），因此测试框架
    //忽略它。
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false,
    });
    // self and source are DEV only properties.
    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self,
    });
    // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.
    //应该考虑在两个不同位置创建的两个元素
    //出于测试目的是相等的，因此我们将其从枚举中隐藏起来。
    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source,
    });
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};
```
只是返回了一个element对象，至于if (__DEV__)中等代码其实可以忽略可以理解为为了防止开发人员对element对象做一些不规范或者可能导致错误的操作。
分析下来，react.createElement只是根据jsx语法编译后产生的参数返回了一个element对象

## Componmrnt PureComponment
``` js
import React from 'react';

export default class Hello extends React.Component {
    ...
}
```
对于react开发者，Componment这个玩意一定不会陌生因为我们写React组件的时候一定会继承这个玩意
``` js

const emptyObject = {};
if (__DEV__) {
  Object.freeze(emptyObject);
}

/**
 * Base class helpers for the updating state of a component.
 */
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

Component.prototype.isReactComponent = {};
Component.prototype.setState = function(partialState, callback) {
  invariant(
    typeof partialState === 'object' ||
      typeof partialState === 'function' ||
      partialState == null,
    'setState(...): takes an object of state variables to update or a ' +
      'function which returns an object of state variables.',
  );
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
Component.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};
```
Componment核心代码差不多就这么多。真的是非常简单。重点就是updater这个属性了。无论是setState或者forceUpdate这种可能会导致组件重新render的方法都是通过this.updater来完成的

至于Purecomponment在开发中使用的频率会比Component少很多具体参考[React文档](https://zh-hans.reactjs.org/docs/react-api.html#reactpurecomponent)

PureComponment不需要我们去手动实现shouldComponmentUpdate更新state和props时会自动做一次浅比较判断是否重新render但是仅仅只是做了一次浅比较如果修改的是数组或者对象的时候可能会出现一些问题，比如值已经发生改变但是页面并没有做出响应。
``` js
function ComponentDummy() {}
ComponentDummy.prototype = Component.prototype;
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

const pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent;
Object.assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;
```
PureComponment实际上是继承Conponment，典型的寄生组合式继承

这两者之间的差别其实比较重要的一点就是**pureComponentPrototype.isPureReactComponent = true;**这一句给PureComponment加了一个标识

## React.createRef
react中的ref用法应该都是比较清楚的了

ref={ref=testRef}

ref={ref=>this.ref=ref}

react.createRef

上面的三种用法，其中第一种用法已经不推荐甚至快要被废弃了。

react.createRef其实是一个超级简单的方法
``` js
export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  if (__DEV__) {
    Object.seal(refObject);
  }
  return refObject;
}
```
就是返回了一个对象，对象的结构很清晰了。当使用<div ref={this.ref} />来绑定ref会给current这个对象赋值一个对象。通过操作current来操作这个组件。

## React.forwardRef

forwardRef这个api用的也比较少具体可参考文档[](https://zh-hans.reactjs.org/docs/react-api.html#reactforwardref)
日常中用的比较多的其实也就是给函数组件绑定ref因为在函数式组件中是没有实例的。不能像class声明的组件直接绑定ref。但是我们可以通过这个组件来实现
``` js
const TargetComponent = React.forwardRef((props, ref) => (
  <TargetComponent ref={ref} />
))
```
这样别人在使用这个组件的时候可以像class组件一样使用ref
forwardRef的api也很简单再删除if(_Dev_)的代码后就这么多
``` js
export default function forwardRef<Props, ElementType: React$ElementType>(
  render: (props: Props, ref: React$Ref<ElementType>) => React$Node,
) {
  return {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render,
  };
}
```
核心就是添加了一个$$typeof的标识