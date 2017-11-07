define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('tenant.pages.tenant-upload', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/pages/tenant-upload/views/index.html',
            controller: 'tenant.pages.TenantUploadPageController'
        });
    }
});
