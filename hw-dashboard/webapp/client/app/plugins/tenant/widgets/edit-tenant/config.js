define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('tenant-edit', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/widgets/edit-tenant/views/tenant-edit.html',
            controller: 'tenant.TenantEditWidgetController'
        });
    }

});
