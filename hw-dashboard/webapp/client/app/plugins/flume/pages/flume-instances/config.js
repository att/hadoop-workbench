define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('flume-instances', {
            templateUrl: dapConfig.pathToPlugins + '/flume/pages/flume-instances/views/index.html',
            controller: 'flume.pages.FlumeInstancesController'
        });
    }
});
