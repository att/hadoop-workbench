define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('flume-alerts', {
            templateUrl: dapConfig.pathToPlugins + '/flume/pages/alerts/views/index.html',
            controller: 'flume.pages.AlertsController'
        });
    }
});
