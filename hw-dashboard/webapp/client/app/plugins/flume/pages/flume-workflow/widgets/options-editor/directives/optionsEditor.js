define(function (require) {
    "use strict";

    require("../ngModule").directive("flumeOptionsEditor", flumeOptionsEditor);

    flumeOptionsEditor.$inject = ["dap.core.config"];
    function flumeOptionsEditor(dapConfig) {

        return {
            restrict: "A",
            scope: {
                node: "=oeSelectedNode",
                connection: "=oeSelectedConnection",
                nodesMetadata: "=oeNodesMetadata"
            },
            controller: "flume.widgets.optionsEditor.indexController",
            templateUrl: dapConfig.pathToPlugins + "/flume/pages/flume-workflow/widgets/options-editor/views/index.html",
            link: function (scope) {
            }
        };
    }

});
