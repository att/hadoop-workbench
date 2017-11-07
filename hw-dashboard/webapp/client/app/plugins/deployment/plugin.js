import data from './reducers/data';

const pluginName = 'deployment';

export default {
    name: pluginName,
    ngModuleName: pluginName,
    dataReducer: data
}
