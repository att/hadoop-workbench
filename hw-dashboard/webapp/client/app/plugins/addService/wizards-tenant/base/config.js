define(function (require) {
    'use strict';

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('addService.tenantWizards.base.container', {
            controller: 'tenant-wizard-base.containerController',
            templateUrl: dapConfig.pathToPlugins + '/addService/wizards-tenant/base/widgets/container/index.html',
            resolve: {
                containers: ['dashboard.searchService', function (searchService) {
                    return searchService.getTenantsListing();
                }]
            }
        });

        $widgetProvider.widget('addService.tenantWizards.base.componentType', {
            controller: 'tenant-wizard-base.componentTypeController',
            templateUrl: dapConfig.pathToPlugins + '/addService/wizards-tenant/base/widgets/component-type/index.html',
            resolve: {
                componentTypes: ['dashboard.searchService', function (searchService) {
                    return searchService.getServiceTypes().then(function (data) {
                        return data.services;
                    });
                }]
            }
        });
    }
});
