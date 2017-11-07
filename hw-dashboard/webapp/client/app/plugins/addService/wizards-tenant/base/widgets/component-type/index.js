define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../../ngModule').controller('tenant-wizard-base.componentTypeController', componentTypeController);

    componentTypeController.$inject = [
        '$scope',
        '$widgetParams',
        'componentTypes',
        '$filter'
    ];
    function componentTypeController($scope, $widgetParams, componentTypes, $filter) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.searchString = '';
        $scope.componentTypesFiltered = [];
        $scope.componentTypes = componentTypes;
        $scope.selectComponentType = function (componentType) {
            $scope.data.componentType = ng.copy(componentType);
            $scope.$emit('nextStep.addService');
        };
        $scope.$watch('searchString', function (searchString) {
            var list = $filter('filter')($scope.componentTypes, {id: searchString});
            $scope.componentTypesFiltered.splice(0);
            $scope.componentTypesFiltered.push.apply($scope.componentTypesFiltered, list);
        });

        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });
    }
});
