define(function (require) {
    "use strict";

    require("../ngModule").directive("flumeAlertsContainer", FlumeAlertsContainer);
    FlumeAlertsContainer.$inject = ["dap.core.config"];

    function FlumeAlertsContainer(dapConfig) {
        return {
            restrict: "A",
            scope: {
                messages: "=acMessages",
                removeAlert: "=acRemoveAlert"
            },
            controller: "flume.widgets.alertsContainer.indexController",
            templateUrl: dapConfig.pathToPlugins + "/flume/pages/flume-workflow/widgets/alerts-container/views/index.html",
            link: function (scope) {

            }
        };
    }
});
