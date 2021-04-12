## Prematch

Prematch 是 ERC 前端开发团队研发的一款轻量级状态管理工具，使用和 [Rematch](https://github.com/rematch/rematch) 一样的API。Gzip 后大小近2KB，与市面的状态管理工具相比，更低碳更适合移动端使用。

### 特性

[Rematch](https://github.com/rematch/rematch) 是 Redux 的最佳实践。它不需要多余的 action types，action creators 和 switch。Prematch 实现了它一样的API的同时，还具备以下优秀特性：

* **低碳轻量**，不需要引入 Redux，Gzip之后的大小不到1kB
* **易学易用**，Prematch 实现了跟 Rematch 一样的Api和模式，对 Redux 和 Rematch 用户尤其友好
* **elm 概念**，通过 reducers, effects 和 state 组织 model
* **插件机制**，支持非 Redux 的官方 plugin，比如 rematch-loading。 可以自动处理 loading 状态，不用一遍遍地写 showLoading 和 hideLoading

### Getting Started

```bash
npm install @prematch/core
```

#### Step 1: Init

**init** 用来配置你的 reducers, devtools & store。

**index.js**

```javascript
import { init } from '@prematch/core'
import * as models from './models'

const store = init({
  models,
})

export default store
```

#### Step 2: Models

**model** 将 state， reducers， 异步 actions 放在同一个地方。

**models.js**

```javascript
export const count = {
  state: 0, // initial state
  reducers: {
    // handle state changes with pure functions
    increment(state, payload) {
      return state + payload
    }
  },
  effects: (dispatch) => ({
    // handle state changes with impure functions.
    // use async/await for async actions
    async incrementAsync(payload, rootState) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      dispatch.count.increment(payload)
    }
  })
}
```

回答几个问题有助于理解 modal：

1. 初始的 state 是什么? **state**
2. 如何改变 state? **reducers**
3. 如何处理异步 actions? **effects** 使用 async/await

#### Step 3: Dispatch

**dispatch** 是触发 model 中 reducers 和 effects 的方式。Dispatch 标准化了 action，而无需编写 action types 或者 action creators。

```javascript
import { init } from '@rematch/core'
import * as models from './models'

const store = init({
  models,
})

export const { dispatch } = store
                                                  // state = { count: 0 }
// reducers
dispatch({ type: 'count/increment', payload: 1 }) // state = { count: 1 }
dispatch.count.increment(1)                       // state = { count: 2 }

// effects
dispatch({ type: 'count/incrementAsync', payload: 1 }) // state = { count: 3 } after delay
dispatch.count.incrementAsync(1)                       // state = { count: 4 } after delay
```

Dispatch 能被直接调用，或者用 `dispatch[model][action](payload)` 简写。

#### Step 4: View

Prematch 提供的 React 高阶组件可以直接连接，而不需要引入 Redux。可以看下面的例子：

```jsx
import React, { Component } from 'react';
import { Button } from 'antd-mobile';
import indexModel from './model';
import store, { getStoreConnect } from '@src/store';
import './index.scss';


store.model(indexModel);

@getStoreConnect(['index', 'num'])
class Index extends Component {

  add = () => {
    const { dispatch } = this.props;
    dispatch.index.add(10)
  }

 render() {
    const { num } = this.props;

    return (
      <div>
        index {num}
        <Button onClick={this.add} >reducers测试</Button>
      </div>
    );
  }
}

export default Index;
```

### Hooks
提供和react-redux类似的useSelector和useDispatch
可在Functional Component中通过hooks连接store
假设已经注册了Step2的model: count

```jsx
import React from 'react';
import { useSelector, useDispatch } from 'prematch';

export default () => {
    const dispatch = useDispatch();
    // const dispatch = useDispatch(d => d.count)
    const { num } = useSelector(s => s.count);
    // const { num } = useSelector('count', 'num');
    
    return (
        <div>
            num: {num}
            <button onClick={() => dispatch.count.incrementAsync(5)}>
                click to add
            </button>
        </div>
    )
}

```
