define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('provision-platform-widget', {
            templateUrl: dapConfig.pathToPlugins + '/addService/dashboard-widgets/provision-platform-widget/views/index.html',
            controller: 'provision-platform-widget.IndexController'
        });

        $widgetProvider.widget('provision-platform', {
            templateUrl: dapConfig.pathToPlugins + '/addService/dashboard-widgets/provision-platform-widget/views/index.html',
            controller: 'provision-platform-widget.IndexController'
        });
    }
});
