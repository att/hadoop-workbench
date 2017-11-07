define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('platform.pages.cluster-info', {
            templateUrl: dapConfig.pathToPlugins + '/platform/pages/cluster-info/views/index.html',
            controller: 'platform.pages.ClusterInfoPageController',
            resolve: {
                'widgetGuid': ['dashboard-isolated-widget-accessor.WidgetStore', function (WidgetStore) {
                    var $dashboardWidget = WidgetStore.getWidget();
                    return $dashboardWidget.guid;
                }],
                'platform-manager-widget.Widget.ClustersActions': ['platform-manager-widget.ClustersActionsFactory', 'widgetGuid', function (actionsFactory, widgetGuid) {
                    return actionsFactory(widgetGuid);
                }],
                'platform-manager-widget.Widget.ClustersStore': ['platform-manager-widget.ClustersStoreFactory', 'widgetGuid', function (storeFactory, widgetGuid) {
                    return storeFactory(widgetGuid);
                }]
            }
        });
    }
});
