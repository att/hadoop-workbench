/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        require('../ngModule').controller('oozie.pages.AddNodeController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams'
        ];

        function indexController($scope, $widgetParams) {
            $scope.nodesMetadata = $widgetParams.params.nodesMetadata;
            $scope.loadTenantsList = $widgetParams.params.loadTenantsList;

            $scope.$on("node-add.node-selector", function (event, nodeData) {
                event.stopPropagation();

                $widgetParams.page.notifySubscribers('node-add', nodeData);
            });

        }
    }
);
