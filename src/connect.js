import React from 'react'

function getDisplayName(Component) {
    return Component.displayName || Component.name || 'Component';
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
* 组合connect与getStore，参数描述请看getStore方法
* @param {...any} args
* @see getStore 参数描述请看getStore方法
*/
export function getStoreConnect(...args) {
    return connect(getStore(...args));
}