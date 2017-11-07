define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('create-tenant-widget', {
            templateUrl: dapConfig.pathToPlugins + '/addService/dashboard-widgets/create-tenant-widget/views/index.html',
            controller: 'create-tenant-widget.IndexController'
        });
    }
});
