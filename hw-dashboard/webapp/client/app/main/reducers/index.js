import { combineReducers } from 'redux';
import ui from './ui';
import data from './data';

const rootReducer = combineReducers({
    ui,
    data
});

export default rootReducer
