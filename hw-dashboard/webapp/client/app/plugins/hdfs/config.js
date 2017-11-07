/*jshint maxparams: 10*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dashboard.WidgetManagerProvider', 'dap-widget.$widgetProvider', 'dap.core.config'];
    function config(DashboardManagerProvider, $widgetProvider, dapConfig) {
        DashboardManagerProvider
            .widget('hdfs-manager', {
                type: 'browser',
                icon: 'icon-hdfs-manager',
                makeParams: function (params) {
                    return params;
                }
            });
    }
});
