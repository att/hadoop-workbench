define(function (require) {
    "use strict";

    require("../ngModule").directive("oozieOptionsEditor", oozieOptionsEditor);

    oozieOptionsEditor.$inject = ["dap.core.config"];
    function oozieOptionsEditor(dapConfig) {

        // TODO(maximk): refactor this to get only one element and its type when widget service instances will be ready

        return {
            restrict: "A",
            scope: {
                node: "=oeNodeModel",
                connection: "=oeConnectionModel",
                fileBrowserSource: "=oeFileBrowserSource",
                readonly: "=readonly"
            },
            controller: "oozie.widgets.optionsEditor.indexController",
            templateUrl: dapConfig.pathToPlugins + "/oozie/pages/oozie-workflow/widgets/options-editor/views/index.html",
            link: function (scope) {
                scope.$watch('node.properties.General.instance.properties.id.instance.value', function (newVal, oldVal) {
                    if (scope.node) {
                        scope.node.id = newVal;
                    }
                });
            }
        };
    }

});
