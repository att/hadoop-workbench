import data from './reducers/data';

const pluginName = 'platform';

export default {
    name: pluginName,
    ngModuleName: pluginName,
    dataReducer: data
}
