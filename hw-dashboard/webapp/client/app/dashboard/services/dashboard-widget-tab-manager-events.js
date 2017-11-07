define(function (require) {
    "use strict";

    require('../ngModule').factory('dashboard.widgets.DashboardWidget.TabManager.EVENTS', getDashboardWidgetTabManagerEvents);

    getDashboardWidgetTabManagerEvents.$inject = ["dashboard.widgets.DashboardWidget.TabManager"];

    function getDashboardWidgetTabManagerEvents(TabManager) {
        return TabManager.EVENTS;
    }
});
