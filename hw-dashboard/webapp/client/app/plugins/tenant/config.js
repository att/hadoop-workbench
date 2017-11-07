/*jshint maxparams: 10*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dashboard.WidgetManagerProvider', 'dap-widget.$widgetProvider', 'dap.core.config'];
    function config(DashboardManagerProvider, $widgetProvider, dapConfig) {
        DashboardManagerProvider
            .widget('tenant-browser', {
                widget: 'tenant',
                icon: 'icon-tenant-browser',
                type: 'browser',
                onReject: ['$dashboardWidgetError', '$dashboardWidget', '$widgetParams', 'main.alerts.alertsManagerService', function (error, $dashboardWidget, $widgetParams, alertsManagerService) {
                    alertsManagerService.addAlertError({
                        title: "Plugin error",
                        text: "Something went wrong during opening tenant browser. Error: " + (error ? error.message : error)
                    });
                }],
                makeParams: function (params) {
                    return params;
                }
            })
            .widget('tenant-node-template', {
                widget: 'tenant-node-template',
                icon: 'icon-tenant-browser',
                type: 'browser',
                onReject: onRejectOpenTemplate,
                makeParams: function (params) {
                    return params;
                }
            })
            .widget('tenant-workflow-template', {
                widget: 'tenant-workflow-template',
                icon: 'icon-oozie-tenant',
                type: 'browser',
                onReject: onRejectOpenTemplate,
                makeParams: function (params) {
                    return params;
                }
            })
            .widget('tenant-flume-template', {
                widget: 'tenant-flume-template',
                icon: 'icon-flume-tenant',
                type: 'browser',
                onReject: onRejectOpenTemplate,
                makeParams: function (params) {
                    return params;
                }
            })
            .widget('tenant-component-deployment', {
                widget: 'tenant-component-deployment',
                icon: 'icon-tenant-browser'
            });

        onRejectOpenTemplate.$inject = [
            '$dashboardWidgetError',
            '$dashboardWidget',
            '$widgetParams',
            'main.alerts.alertsManagerService'
        ];
        function onRejectOpenTemplate(error, $dashboardWidget, $widgetParams, alertsManagerService) {
            /*alertsManagerService.addAlertError({
             title: "Can't open template " + $widgetParams.template.info.id,
             text: error.message
             });*/
            $dashboardWidget.go('tenant-browser');
        }
    }
});
