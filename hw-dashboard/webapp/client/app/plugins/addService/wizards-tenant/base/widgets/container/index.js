define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../../ngModule').controller('tenant-wizard-base.containerController', containerController);

    containerController.$inject = [
        '$scope',
        '$widgetParams',
        'containers',
        '$filter'
    ];
    function containerController($scope, $widgetParams, containers, $filter) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.searchString = '';
        $scope.containersFiltered = [];
        $scope.containers = containers;
        /**
         * Pre-select Default container automatically
         */
        if (!$scope.data.container && $scope.containers.length && $scope.containers[0]) {
            $scope.data.container = ng.copy($scope.containers[0]);
        }
        $scope.selectContainer = function (container) {
            $scope.data.container = ng.copy(container);
            $scope.$emit('nextStep.addService');
        };
        $scope.$watch('searchString', function (searchString) {
            var list = $filter('filter')($scope.containers, {name: searchString});
            $scope.containersFiltered.splice(0);
            $scope.containersFiltered.push.apply($scope.containersFiltered, list);
        });

        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });
    }
});
