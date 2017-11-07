define(function (require) {
    "use strict";

    require("../ngModule").directive("flumePlugin", flumePlugin);

    flumePlugin.$inject = ["dap.core.config"];

    function flumePlugin(dapConfig) {
        return {
            restrict: "A",
            controller: "flume.indexController",
            templateUrl: dapConfig.pathToPlugins + "/flume/views/index.html",
            scope: {
                flumePlugin: "=",
                widgetControls: "=",
                data: "=flumeData"
            },
            link: function ($scope) {
                $scope.flumePlugin.secondaryTitle = 'Flume';
            }
        };
    }
});