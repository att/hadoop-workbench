define(function (require) {
    "use strict";

    require("../ngModule").directive("oozieAlertsContainer", OozieAlertsContainer);
    OozieAlertsContainer.$inject = ["dap.core.config"];

    function OozieAlertsContainer(dapConfig) {
        return {
            restrict: "A",
            scope: {
                messages: "=acMessages",
                removeAlert: "=acRemoveAlert"
            },
            controller: "oozie.widgets.alertsContainer.indexController",
            templateUrl: dapConfig.pathToPlugins + "/oozie/pages/oozie-workflow/widgets/alerts-container/views/index.html",
            link: function (scope) {

            }
        };
    }
});
