define(function (require) {
    "use strict";

    require("../ngModule").directive('oozieFlowchart', oozieFlowchart);

    oozieFlowchart.$inject = ["dap.core.config"];
    function oozieFlowchart(dapConfig) {
        return {
            templateUrl: dapConfig.pathToPlugins + "/oozie/pages/oozie-workflow/widgets/flowchart/views/index.html",
            restrict: 'A',
            scope: {
                nodes: '=',
                nodeValidatorCb: '=',
                connections: '=',
                selectedNodeContainer: '=',
                multipleSelectedNodeContainer: '@',
                selectedConnection: '=',
                onConnectionCreated: '=',
                selectedModule: '=',
                dashboardWidget: '=',
                afterNodeRemovedCb: "=",
                afterConnectionRemovedCb: "=",
                metrics: '=',
                alertTitle: "@"
            },
            controller: 'oozie.widgets.flowchart.indexController'
        };
    }
});
