define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('oozie-alerts', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/pages/alerts/views/index.html',
            controller: 'oozie.pages.AlertsController'
        });
    }
});
