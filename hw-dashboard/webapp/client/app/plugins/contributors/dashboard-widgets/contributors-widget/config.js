define(function (require) {
    "use strict";

    require('./ngModule').config(configurationConfig);

    configurationConfig.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function configurationConfig($widgetProvider, dapConfig) {
        $widgetProvider.widget('contributors-widget', {
            templateUrl: dapConfig.pathToPlugins + '/contributors/dashboard-widgets/contributors-widget/views/index.html',
            controller: 'contributors-widget.IndexController',
            resolve: {
                $dashboardWidget: ['dashboard-isolated-widget-accessor.WidgetStore', function (WidgetStore) {
                    return WidgetStore.getWidget();
                }]
            }
        });
    }
});
