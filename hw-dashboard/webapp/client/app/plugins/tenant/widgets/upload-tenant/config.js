define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('tenant-uploader', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/widgets/upload-tenant/views/tenant-uploader.html',
            controller: 'tenant.TenantUploaderWidgetController'
        });
    }

});
