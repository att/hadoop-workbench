define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('tenant-page', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/pages/tenant-page/views/index.html',
            controller: 'tenant.pages.TenantPageContainerPageController'
        });
    }
});
