define(function (require) {
    "use strict";

    var $ = require('jquery');
    var ng = require('angular');
    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function oozieConfig($widgetProvider, dapConfig) {

        $widgetProvider.widget('platform.pages.platform-info', {
            templateUrl: dapConfig.pathToPlugins + '/platform/pages/platform-info/views/index.html',
            controller: 'platform.pages.PlatformInfoPageController',
            resolve: {
                'platform-manager-widget.Widget.PlatformsStore': ['platform-manager-widget.PlatformsStoreFactory', 'dashboard-isolated-widget-accessor.WidgetStore', function (storeFactory, WidgetStore) {
                    var $dashboardWidget = WidgetStore.getWidget();
                    var widgetGuid = $dashboardWidget.guid;
                    return storeFactory(widgetGuid);
                }]
            }
        });
    }
});
