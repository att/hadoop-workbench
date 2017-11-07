define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {
        $widgetProvider.widget('clusters-browser', {
            templateUrl: dapConfig.pathToPlugins + '/platform/pages/clusters-browser/views/index.html',
            controller: 'platform.pages.ClustersBrowserPageController',
            resolve: {
                'widgetGuid': ['dashboard-isolated-widget-accessor.WidgetStore', function (WidgetStore) {
                    var $dashboardWidget = WidgetStore.getWidget();
                    return $dashboardWidget.guid;
                }],
                'platform-manager-widget.Widget.PlatformsActions': ['platform-manager-widget.PlatformsActionsFactory', 'widgetGuid', function (actionsFactory, widgetGuid) {
                    return actionsFactory(widgetGuid);
                }],
                'platform-manager-widget.Widget.PlatformsStore': ['platform-manager-widget.PlatformsStoreFactory', 'widgetGuid', function (storeFactory, widgetGuid) {
                    return storeFactory(widgetGuid);
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
