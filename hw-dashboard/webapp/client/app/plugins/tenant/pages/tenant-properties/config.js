define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('tenant.pages.tenant-properties', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/pages/tenant-properties/views/index.html',
            controller: 'tenant.pages.TenantPropertiesPageController',
            resolve: {
                restrictionsService: ['dap.shared.validation.RestrictionsService', function (RestrictionsService) {
                    return RestrictionsService.factory();
                }]
            }
        });
    }
});
