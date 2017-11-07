define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('tenant-browser-widget', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-browser-widget/views/index.html',
            controller: 'tenant-browser-widget.IndexController'
        });
    }
});
