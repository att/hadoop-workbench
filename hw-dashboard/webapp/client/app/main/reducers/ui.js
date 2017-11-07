import { combineReducers } from 'redux';
import widgets from './widgets';
import menu from "./menu";
import plugins from '../plugins';

const uiReducer = combineReducers({
    widgets,
    menu
});

export default uiReducer
