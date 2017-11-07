define(function (require) {
    'use strict';

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        /* Not used*/
        $widgetProvider.widget('addService.platformWizards.base.cluster-details', {
            controller: 'platform-wizard-base.clusterDetailsController',
            templateUrl: dapConfig.pathToPlugins + '/addService/wizards-platform/base/widgets/cluster-details/index.html',
            resolve: {}
        });

        /* Not used*/
        $widgetProvider.widget('addService.platformWizards.base.access', {
            controller: 'platform-wizard-base.accessController',
            templateUrl: dapConfig.pathToPlugins + '/addService/wizards-platform/base/widgets/access/index.html',
            resolve: {}
        });

        // @TODO: refactor this to use widget factory
        for (var i = 0; i < 10; i++) {
            $widgetProvider.widget('addService.platformWizards.base.universal' + (i), {
                controller: 'platform-wizard-base.universalController',
                templateUrl: dapConfig.pathToPlugins + '/addService/wizards-platform/base/widgets/universal/index.html',
                resolve: {}
            });
        }

    }
});
