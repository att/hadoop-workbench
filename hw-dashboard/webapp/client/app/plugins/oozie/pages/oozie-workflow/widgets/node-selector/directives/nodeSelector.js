define(function (require) {
    "use strict";

    require("../ngModule").directive('oozieNodeSelector', nodeSelector);

    nodeSelector.$inject = ["dap.core.config"];
    function nodeSelector(dapConfig) {
        return {
            templateUrl: dapConfig.pathToPlugins + "/oozie/pages/oozie-workflow/widgets/node-selector/views/index.html",
            restrict: 'A',
            scope: {
                nodesMetadata: "=nsNodesMetadata",
                addNodeCb: "=nsAddNodeCb",
                loadTenantsList: "=nsLoadTenantsList"
            },
            controller: "oozie.widgets.nodeSelector.indexController"
        };
    }
});
