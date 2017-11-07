define(function (require) {
    "use strict";

    require("../ngModule").directive('flumeNodeSelector', nodeSelector);

    nodeSelector.$inject = ["dap.core.config"];
    function nodeSelector(dapConfig) {
        return {
            templateUrl: dapConfig.pathToPlugins + "/flume/pages/flume-workflow/widgets/node-selector/views/index.html",
            restrict: 'A',
            scope: {
                nodesMetadata: "=nsNodesMetadata",
                addNodeCb: "=nsAddNodeCb"
            },
            controller: "flume.widgets.nodeSelector.indexController"
        };
    }
});
