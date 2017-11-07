define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('deployment-manager-widget', {
                templateUrl: dapConfig.pathToPlugins + '/deployment/dashboard-widgets/deployment-manager-widget/views/index.html',
                controller: 'deployment-manager-widget.IndexController',
                resolve: {
                    'widgetGuid': ['dashboard-isolated-widget-accessor.WidgetStore', function (WidgetStore) {
                        var $dashboardWidget = WidgetStore.getWidget();
                        return $dashboardWidget.guid;
                    }]
                }
            });
    }
});
