import {
    GET_PLATFORM_MODULES_LISTING_REQUEST,
    GET_PLATFORM_MODULES_LISTING_SUCCESS,
    GET_PLATFORM_MODULES_LISTING_FAILURE
} from '../constants/action-types';

angular.module('tenant').factory('platform.redux-actions', actions);

actions.$inject = ['dashboard.searchService', 'main.alerts.alertsManagerService'];
function actions(searchService, alertsManagerService) {
    return {
        getModulesListing(){
            return {
                types: [GET_PLATFORM_MODULES_LISTING_REQUEST, GET_PLATFORM_MODULES_LISTING_SUCCESS, GET_PLATFORM_MODULES_LISTING_FAILURE],
                notifications: [null, null, alertsManagerService.createAlertError("Search deployed components")],
                call: () => searchService.getModules()
            }
        }
    }
}
