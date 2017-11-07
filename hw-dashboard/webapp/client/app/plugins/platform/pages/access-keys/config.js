define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('platform.pages.access-keys', {
            templateUrl: dapConfig.pathToPlugins + '/platform/pages/access-keys/views/index.html',
            controller: 'platform.pages.AccessKeysPageController',
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
                }]
            }
        });
    }
});
