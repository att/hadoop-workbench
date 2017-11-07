define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config',
        'RestangularProvider'
    ];
    function config($widgetProvider, dapConfig, Restangular) {
        Restangular.setBaseUrl('/hw/module/flume-web/api/v1.0');

        $widgetProvider.widget('flume-widget', {
            templateUrl: dapConfig.pathToPlugins + '/flume/dashboard-widgets/flume-widget/views/index.html',
            controller: 'flume-widget.IndexController',
            resolve: {
                loadedAgent: ['$q', 'flume.restService', 'dashboard-isolated-widget-accessor.WidgetStore',
                    function ($q, restService, WidgetStore) {
                        var $dashboardWidget = WidgetStore.getWidget();
                        return restService.getAgent('v1.0', $dashboardWidget.params.source);
                    }]
            }
        });
    }
});
