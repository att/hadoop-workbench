define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('flume.pages.instance', {
            templateUrl: dapConfig.pathToPlugins + '/flume/pages/instance/views/index.html',
            controller: 'flume.pages.FlumeInstanceController',
            resolve: {

            }
        });
    }
});
