define(function (require) {
    "use strict";

    require('../../ngModule').controller('addService.wizards-tenant.oozie.versionController', versionController);

    versionController.$inject = [
        '$scope',
        '$widgetParams',
        'versions',
        '$filter'
    ];
    function versionController($scope, $widgetParams, versions, $filter) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.searchString = '';
        $scope.versionsFiltered = [];
        $scope.versions = versions;
        $scope.selectVersion = function (version) {
            $scope.data.version = version;
            $scope.$emit('nextStep.addService');
        };
        $scope.$watch('searchString', function (searchString) {
            var list = $filter('filter')($scope.versions, searchString);
            $scope.versionsFiltered.splice(0);
            $scope.versionsFiltered.push.apply($scope.versionsFiltered, list);
        });

        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });
    }
});
