/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        require('../ngModule').controller('flume.pages.AddNodeController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams'
        ];

        function indexController($scope, $widgetParams) {
            $scope.addNewNode = $widgetParams.params.addNewNode;
            $scope.nodesMetadata = $widgetParams.params.nodesMetadata;
        }
    }
);
