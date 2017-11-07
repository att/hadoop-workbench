define(function (require) {
    "use strict";

    require('../ngModule').factory("dashboard.models.TabPage.EVENTS", getTabPage);

    getTabPage.$inject = ["dashboard.models.TabPage"];
    function getTabPage(TabPage) {
        return TabPage.EVENTS;
    }
});
