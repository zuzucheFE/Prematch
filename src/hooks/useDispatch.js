import store from '../prematchStore';

export default function useDispatch(filter) {
    if (typeof filter === 'function') {
        return filter(store.dispatch);
    }

    return { ...store.dispatch };

}
