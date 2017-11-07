define(function (require) {
    "use strict";

    require("../ngModule").directive('oozieJobFlowchart', oozieFlowchart);

    oozieFlowchart.$inject = ["dap.core.config"];
    function oozieFlowchart(dapConfig) {
        return {
            templateUrl: dapConfig.pathToPlugins + "/oozie/pages/job/widgets/job-flowchart/views/index.html",
            restrict: 'A',
            scope: {
                nodes: '=',
                nodeValidatorCb: '=',
                connections: '=',
                selectedNodeContainer: '=',
                selectedConnection: '=',
                onConnectionCreated: '=',
                selectedModule: '=',
                dashboardWidget: '=',
                afterNodeRemovedCb: "=",
                afterConnectionRemovedCb: "=",
                actions: '=',
                metrics: '=',
                alertTitle: '@'
            },
            controller: 'oozie.widgets.job-flowchart.IndexController'
        };
    }
});
