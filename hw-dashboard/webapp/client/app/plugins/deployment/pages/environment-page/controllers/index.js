/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        var ng = require('angular');
        require('../ngModule').controller('deployment.pages.EnvironmentPageController', indexController);

        var angular = require("angular");

        indexController.$inject = [
            '$scope',
            '$widgetParams',
        ];

        function indexController($scope, $widgetParams) {
            var page = $widgetParams.page;
            $scope.page = page;

            $scope.params = {
                clusterId: $widgetParams.params.clusterId,
                platformId: $widgetParams.params.platformId,
                clusterTypes: $widgetParams.params.clusterTypes,
            };
        }
    }
);
