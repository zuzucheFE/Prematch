import { useReducer, useRef, useLayoutEffect } from 'react';
import { shallowEqual } from '../util';
import store, { getStore } from '../prematchStore';

export default function useSelector(...args) {
    const selector = getStore(...args);
    const [, forceRender] = useReducer(s => s + 1, 0);

    const latestSelector = useRef();
    const latestStoreState = useRef();
    const latestSelectedState = useRef();

    const storeState = store.getState();
    let selectedState;

    if (
        selector !== latestSelector.current ||
        storeState !== latestStoreState.current
    ) {
        selectedState = selector(storeState);
    } else {
        selectedState = latestSelectedState.current;
    }

    useLayoutEffect(() => {
        latestSelector.current = selector;
        latestStoreState.current = storeState;
        latestSelectedState.current = selectedState;
    });

    useLayoutEffect(() => {
        function checkForUpdate() {
            try {
                const newSelectedState = latestSelector.current(store.getState());
                if (shallowEqual(newSelectedState, latestSelectedState.current)) {
                    return;
                }

                latestSelectedState.current = newSelectedState;
            } catch (err) {
                console.log(err);
            }

            forceRender();
        }

        const unsubscribe = store.subscribe(checkForUpdate);
        checkForUpdate();

        return unsubscribe;
    }, []);

    return selectedState;

}
