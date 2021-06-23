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

## jsx到javaScript的转换
``` js
function Comp = () => {
  return ...
}
<div className={danger} key='1'>
  1111
  <span>2222</span>
</div >
}
<Comp />
```
在react中使用jsx语法的时候会用Babel的jsx编译器转成react.createElement方法，参数就是这个对象
``` js
  react.createElement('div',
    {className: 'danger', key: '1'}
   '111', 
   react.createElement('span', null, '2222')),
  )
  react.createElement(Comp, null)
```
react根据组件首字母是否大些来判断当前组件是原生组件或者自定义组件，传参方式不同。原生组件为字符串，自定义组件为一个变量
## react.createElement
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
  // 处理 children 的几个操作
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
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

经过上述处理后会得到几个值type、key等这些值,得到这几个值后会把这些值作为参数传递给 ReactElement方法，这个实际上也只是一个工厂函数
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

  return element;
};
```
只是返回了一个element对象。。。

## Componmrnt PureComponment
``` js
import React from 'react';

export default class Hello extends React.Component {
    ...
}
```
react写类组件的时候一定会继承React.Component。这里面有setState, compomentDidMount等一系列方法
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
Component代码只有这么多。除了props、context这些常见的参数之外，还要一个updater。后续setState,forceUpdate会依赖这个updater。

Purecomponment具体参考[React文档](https://zh-hans.reactjs.org/docs/react-api.html#reactpurecomponent)

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

react.createRef
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
就是返回了一个对象。当使用<div ref={this.ref} />来绑定ref会给current这个对象赋值一个对象。通过操作current来操作这个组件。

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