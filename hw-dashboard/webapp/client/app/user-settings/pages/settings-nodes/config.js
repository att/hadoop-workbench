define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('user-settings.pages.settings-nodes', {
            templateUrl: dapConfig.pathToApp + '/user-settings/pages/settings-nodes/views/index.html',
            controller: 'userSettings.pages.SettingsNodesPageController',
            resolve: {
                currentUser: ['$rootScope', ($rootScope) => {
                    return $rootScope.currentUser;
                }],
                userSettingsReadAccess : ['currentUser', (currentUser) => {
                    return currentUser.features.indexOf('USER_SETTINGS_READ') !== -1;
                }],
                usersData: ['userSettings.restService', 'userSettingsReadAccess', (restService, userSettingsReadAccess) => {
                    if (userSettingsReadAccess) {
                        return restService.getUsersRolesAssignments().catch(
                            (errorMessage) => {
                                return {
                                    errorMessage: errorMessage
                                }
                            }
                        );
                    } else {
                        return [];
                    }

                }],
                rolesList: ['userSettings.restService', 'userSettingsReadAccess', (restService, userSettingsReadAccess) => {
                    if (userSettingsReadAccess) {
                        return restService.getRolesList().catch(
                            (errorMessage) => {
                                return {
                                    errorMessage: errorMessage
                                }
                            }
                        );
                    } else {
                        return [];
                    }
                }],
            }
        });
    }
});
