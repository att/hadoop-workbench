import {combineReducers} from 'redux';
import oozieTemplates from './oozieTemplates'
import flumeTemplates from './flumeTemplates'
import templates from './templates'
import tenants from './tenants';

export default combineReducers({oozieTemplates, flumeTemplates, templates, tenants})
