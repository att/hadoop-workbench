define(function (require) {
    "use strict";

    require('../../ngModule').controller('deploy-component.wizards.flume.serviceController', serviceController);

    serviceController.$inject = [
        '$scope',
        '$widgetParams',
        'services',
        '$filter'
    ];
    function serviceController($scope, $widgetParams, services, $filter) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.searchString = '';
        $scope.servicesFiltered = [];
        $scope.services = services;
        $scope.selectService = function (service) {
            $scope.data.service = service;
            $scope.$emit('next-step.deploy-component-service');
        };
        $scope.$watch('searchString', function (searchString) {
            var list = $filter('filter')($scope.services, searchString);
            $scope.servicesFiltered.splice(0);
            $scope.servicesFiltered.push.apply($scope.servicesFiltered, list);
        });
        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });
    }
});
