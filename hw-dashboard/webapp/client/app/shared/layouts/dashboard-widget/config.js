define(function (require) {
    "use strict";

    require('./controllers/index');
    require('./ngModule').config(configure);

    configure.$inject = ['dap.core.config', 'dap-widget.$widgetProvider'];
    function configure(dapConfig, $widgetProvider) {
        $widgetProvider.widget('dashboard-widget-layout', {
            templateUrl: dapConfig.pathToLayouts + '/dashboard-widget/views/index.html',
            controller: 'layouts.DashboardWidgetController',
            resolve: {
                'dashboard-isolated-widget-accessor.WidgetStore': ['dashboard-isolated-widget-accessor.WidgetStoreFactory', '$widgetParams', /*'widgetConfig',*/ function (storeFactory, $widgetParams, widgetConfig) {
                    var widgetGuid = $widgetParams.guid;//widgetConfig.getOptions()['widgetGUID'];
                    return storeFactory(widgetGuid);
                }],
                'dashboard-isolated-widget-accessor.WidgetActions': ['dashboard-isolated-widget-accessor.WidgetActionsFactory', '$widgetParams', /*'widgetConfig',*/ function (actionsFactory, $widgetParams, widgetConfig) {
                    var widgetGuid = $widgetParams.guid;//widgetConfig.getOptions()['widgetGUID'];
                    return actionsFactory(widgetGuid);
                }]
            }
        });
    }
});
