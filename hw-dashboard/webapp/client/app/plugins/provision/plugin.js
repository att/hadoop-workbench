import data from './reducers/data';

const pluginName = 'provision';

export default {
    name: pluginName,
    ngModuleName: pluginName,
    dataReducer: data
}
