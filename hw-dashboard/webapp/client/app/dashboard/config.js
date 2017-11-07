define(function (require) {
    "use strict";

    require('./ngModule').config(configure);

    configure.$inject = ['dap.core.config', '$stateProvider'];
    function configure(dapConfig, $stateProvider) {
        $stateProvider
            .state('app.dashboard', {
                url: 'dashboard',
                templateUrl: dapConfig.pathToApp + '/dashboard/views/index.html',
                controller: 'dashboard.indexController',
                resolve: {
                    auth: ['auth.authResolver', function (authResolver) {
                        return authResolver.resolve();
                    }],
                    settings: ['userSettings.settingsResolver', function (settingsResolver) {
                        return settingsResolver.resolve();
                    }],
                    uiSettings: ['uiSettings.settingsResolver', function (settingsResolver) {
                        return settingsResolver.resolve();
                    }],
                    userDashboard: ["dashboard.userDashboardStateResolver", function (userDashboardStateResolver) {
                        return userDashboardStateResolver.resolve();
                    }]
                }
            });
    }
});
