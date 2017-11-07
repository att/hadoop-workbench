define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('tenant-browser', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/pages/tenant-browser/views/index.html',
            controller: 'tenant.pages.TenantBrowserPageController'
        });
    }
});
