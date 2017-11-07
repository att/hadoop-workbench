define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('create-tenant-component-widget', {
            templateUrl: dapConfig.pathToPlugins + '/addService/dashboard-widgets/create-tenant-component-widget/views/index.html',
            controller: 'create-tenant-component-widget.IndexController'
        });
    }
});
