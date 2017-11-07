import {
    SEND_NOTIFICATION,
    CLEAR_NOTIFICATION
} from '../constants/action-types';

angular.module('dap.main').factory('alerts.redux-action-creators', creators);

function creators() {
    return {
        sendNotification(notification){
            return {
                type: SEND_NOTIFICATION,
                notification: notification
            }
        },
        clearNotification(notification){
            return {
                type: CLEAR_NOTIFICATION,
                notification: notification
            }
        }
    }
}