import data from './reducers/data';

const pluginName = 'tenant';

export default {
    name: pluginName,
    ngModuleName: pluginName,
    dataReducer: data
}
