define(function (require) {
    "use strict";

    require("../ngModule").directive('flumeFlowchart', flumeFlowchart);

    flumeFlowchart.$inject = ["dap.core.config"];
    function flumeFlowchart(dapConfig) {
        return {
            templateUrl: dapConfig.pathToPlugins + "/flume/pages/flume-workflow/widgets/flowchart/views/index.html",
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
            controller: 'flume.widgets.flowchart.indexController'
        };
    }
});
