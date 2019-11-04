// 状态管理方案一，不引入rematch而使用rematch
import React from 'react';
import { shallowEqual, objGet } from './util';

/**
 * @template S
 * @typedef {Object} Model
 * @prop {string} name
 * @prop {S} state
 * @prop {Object.<string,(state:S, payload) => S>} reducers
 * @prop {Object.<string,(payload, state:S) => *>} effects
 */

const all = {
    listeners: [],
    state: {},
    models: {}
};

/**
 * 触发数据变更
 */
function emit() {
    all.listeners.forEach(listener => {
        try {
            listener();
        } catch (error) {
            console.error(error);
        }
    });
}

/**
 * 订阅数据变更，一旦state有变更（reducers返回新state），将会同步调用所有listener
 * @param {()=>*} listener
 */
function subscribe(listener) {
    all.listeners.push(listener);
    return function unsubscribe() {
        all.listeners = all.listeners.filter(f => f !== listener);
    };
}
/**
 * @param {{type:string}} action
 * 触发action
 * both a function (dispatch) and an object (dispatch[modelName][actionName])
 */
function dispatch(action) {
    const { type, payload } = action;
    const [modelName, reducerName] = type.split('/');
    const someModel = all.models[modelName];
    if (!someModel) return action;
    const reducer = someModel.reducers ? someModel.reducers[reducerName] : null;
    const effect = someModel.effects ? someModel.effects[reducerName] : null;
    const modelState = all.state[modelName];
    let promise = null;
    if (reducer) {
        const newState = reducer(modelState, payload);
        if (newState !== modelState) {
            all.state = { ...all.state, [modelName]: newState };
            emit();
        }
        promise = Promise.resolve(action);
    }
    if (effect) {
        promise = Promise.resolve(effect.call(dispatch[modelName], payload, all.state));
    }
    return promise;
}

/**
 * 创建附着在dispatch上的caller
 * @param {Model<*>} mod
 */
function createCaller({ name, reducers, effects }) {
    const caller = {};
    const nameObj = { ...reducers, ...effects };
    Object.keys(nameObj).forEach(key => {
        caller[key] = payload => dispatch({ type: `${name}/${key}`, payload });
        // 给官方plugin用的isEffect属性
        caller[key].isEffect = effects && Object.keys(effects).includes(key);
    });
    return caller;
}

/**
 * 注册model
 * @param {Model<*>} mod
 */
function model({ ...mod }) {
    const { name, state, effects } = mod;
    all.state = { ...all.state, [name]: { ...state } };
    if (typeof effects === 'function') mod.effects = effects(dispatch);
    all.models[name] = mod;
    dispatch[name] = createCaller(mod);
    return dispatch[name];
}

function getDisplayName(Component) {
    return Component.displayName || Component.name || 'Component';
}

const store = {
    dispatch,
    subscribe,
    getState() {
        return all.state;
    },
    model
};

/**
 * 监听指定路径的数据变更，
 * 例如subscribeData('test.testA',(newState,old)=>console.log(newState,old))
 * 将会在test.testA数据发生变化的时候，触发回调
 * @param {string} path
 * @param {(newState, oldState)=>*} callback
 */
export function subscribeData(path, callback) {
    let oldState = objGet(store.getState(), path);
    return store.subscribe(() => {
        const newState = objGet(store.getState(), path);
        if (newState !== oldState) {
            oldState = newState;
            callback(newState, oldState);
        }
    });
}

/**
 * 连接组件与store
 * @param {(state,props)=>props} mapStateToProps
 */
export function connect(mapStateToProps) {
    const shouldSubscribe = Boolean(mapStateToProps);
    const finalMapStateToProps = mapStateToProps;

    function computeStateProps(thisStore, props) {
        const state = thisStore.getState();
        const stateProps = finalMapStateToProps ? finalMapStateToProps(state, props) : {};
        return stateProps;
    }

    return function wrapWithConnect(WrappedComponent) {
        class Connect extends React.Component {
            constructor(props, context) {
                super(props, context);
                this.store = store;

                this.state = {
                    storeState: computeStateProps(this.store, props)
                };
                this.trySubscribe();
            }

            shouldComponentUpdate(nextProps, nextState) {
                const stateChanged = nextState.storeState !== this.state.storeState;
                const propsChanged = !shallowEqual(nextProps, this.props);

                return propsChanged || stateChanged;
            }

            componentWillUnmount() {
                this.tryUnsubscribe();
            }

            getWrappedInstance() {
                return this.wrappedInstance;
            }

            setWrappedInstance = d => this.wrappedInstance = d

            handleChange = () => {
                if (!this.isSubscribed()) return;
                this.updateStateProps();
            }

            isSubscribed() {
                return typeof this.unsubscribe === 'function';
            }

            trySubscribe() {
                if (shouldSubscribe && !this.unsubscribe) {
                    this.unsubscribe = this.store.subscribe(this.handleChange);
                    this.handleChange();
                }
            }

            tryUnsubscribe() {
                if (this.unsubscribe) {
                    this.unsubscribe();
                    this.unsubscribe = null;
                }
            }

            updateStateProps(props = this.props) {
                const nextStateProps = computeStateProps(this.store, props);
                if (shallowEqual(nextStateProps, this.state.storeState)) return;
                this.setState({
                    storeState: nextStateProps
                });
            }

            render() {
                return (
                    <WrappedComponent
                        ref={this.setWrappedInstance}
                        {...this.props}
                        {...this.state.storeState}
                        dispatch={dispatch}
                    />
                );
            }
        }
        Connect.displayName = `Connect(${getDisplayName(WrappedComponent)})`;
        Connect.WrappedComponent = WrappedComponent;

        return Connect;
    };
}

/**
* 根据传入参数，生成从store中获取指定数据的方法
* @param {...any} arg - 可传入多个参数
* @returns {(store)=>Object} 接受一个Object作为state，返回指定数据构成的另一个object
* @example
* 传入‘app.user’，会返回{user: store.app.user}
* 传入‘*app’，会返回{...store.app}
* 传入数组['app','user','productId']，会返回{user: store.app.user, productId: store.app.productId}
* 传入Object {appUser:'app.user'}，则会返回{appUser: store.app.user}
* 传入参数是方法，则传入store调用，并把结果与其他参数返回的结果混合
*/
export function getStore(...args) {
    return function (state) {
        return args.reduce((p, arg) => {
            if (typeof arg === 'function') {
                return { ...p, ...arg(state) };
            } if (Array.isArray(arg)) {
                const keys = arg.concat();
                const name = keys.shift();
                const modal = state[name];
                const d = { ...p };
                keys.forEach(k => d[k] = objGet(modal, k));
                return d;
            } if (typeof arg === 'object') {
                const d = { ...p };
                Object.keys(arg).forEach(k => d[k] = objGet(state, arg[k]));
                return d;
            } if (typeof arg === 'string') {
                const data = arg[0] === '*' ? objGet(state, arg.slice(1)) : objGet(state, arg);
                return arg[0] === '*' ? { ...p, ...data } : { ...p, [arg.split(/[.[\]"']/).pop()]: data };
            }
            return p;
        }, {});
    };
}

/**
* 组合connect与getStore，参数描述请看getStore方法
* @param {...any} args
* @see getStore 参数描述请看getStore方法
*/
export function getStoreConnect(...args) {
    return connect(getStore(...args));
}

export default store;
