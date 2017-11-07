define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('kafka-topics-browser', {
            templateUrl: dapConfig.pathToPlugins + '/platform/pages/kafka-topics-browser/views/index.html',
            controller: 'platform.pages.KafkaTopicsBrowserPageController',
            resolve: {
                'widgetGuid': ['dashboard-isolated-widget-accessor.WidgetStore', function (WidgetStore) {
                    var $dashboardWidget = WidgetStore.getWidget();
                    return $dashboardWidget.guid;
                }],
            }
        });
    }
});
