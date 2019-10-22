// 提供rematch plugin支持
import store from './rematchStore';

const all = {
    plugins: []
};

const merge = (original = {}, next = {}) => ({ ...next, ...original });

const mergeConfig = (initConfig) => {
    const config = {
        name: initConfig.name,
        models: {},
        plugins: [],
        ...initConfig,
    };

    config.plugins.forEach(plugin => {
        if (plugin.config) {
            // 合并plugin的models
            const models = merge(config.models, plugin.config.models);
            config.models = models;
        }
    });

    return config;
};

const forEachPlugin = (method, fn) => {
    all.plugins.forEach(plugin => {
        if (plugin[method]) {
            fn(plugin[method]);
        }
    });
};

const addModel = (model) => {
    store.model(model);
    forEachPlugin('onModel', (onModel) => onModel.call(store, model));
};

export default function init(initConfig = {}) {
    const config = mergeConfig({ ...initConfig });
    const { plugins = [], models } = config;
    all.plugins = plugins;
    Object.keys(models).forEach(name => {
        const model = models[name];
        addModel(model);
    });

    const rematchStore = { ...store, model: addModel };

    forEachPlugin('onStoreCreated', (onStoreCreated) => {
        const returned = onStoreCreated.call(rematchStore, rematchStore);
        // 如果onStoreCreated返回一个object
        // 合并这个object到store上
        if (returned) {
            Object.keys(returned || {}).forEach((key) => {
                rematchStore[key] = returned[key];
            });
        }
    });
    return rematchStore;
}
