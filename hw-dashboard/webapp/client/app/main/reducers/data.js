import { combineReducers } from 'redux';
import plugins from '../plugins';

export default combineReducers(plugins.dataReducers)
