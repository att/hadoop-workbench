import { combineReducers } from 'redux';
import cuid from 'cuid';
import {
    SEND_NOTIFICATION,
    CLEAR_NOTIFICATION
} from '../constants/action-types';

function alerts(notifications = [], action) {
    switch (action.type) {
        case SEND_NOTIFICATION:
        {
            return [
                ...notifications,
                action.notification
            ]
        }
        case CLEAR_NOTIFICATION:
        {
            let index = notifications.indexOf(action.notification);
            if (index !== -1) {
                let items = notifications.slice();
                items.splice(index, 1);
                return items;
            } else {
                return notifications;
            }
        }
        default:
        {
            return notifications;
        }
    }
}

export default {
    name: "alerts",
    ngModuleName: 'dap.main',
    dataReducer: alerts
}