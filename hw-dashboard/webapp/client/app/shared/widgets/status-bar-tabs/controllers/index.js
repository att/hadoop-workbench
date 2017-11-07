/*jshint maxparams:14*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').controller('status-bar-tabs.IndexController', IndexController);

    IndexController.$inject = [
        "$scope",
        "dashboard-isolated-widget-accessor.WidgetStore",
        "dashboard-isolated-widget-accessor.widget-store-events"
    ];
    function IndexController($scope, widgetStore, widgetStoreEvents) {

        ng.extend($scope, {
                tabs: widgetStore.getStatusBarTabs()
        });

        $scope.$listenTo(widgetStore, widgetStoreEvents.STATUS_BAR_TABS_CHANGED, function () {
            $scope.tabs = widgetStore.getStatusBarTabs();
        });

    }
});
