define(function (require) {
    "use strict";

    require('../../ngModule').controller('addService.wizards-tenant.flume.inputDataController', inputDataController);

    inputDataController.$inject = [
        '$scope',
        '$widgetParams'
    ];
    function inputDataController($scope, $widgetParams) {
        $scope.data = $widgetParams.data;

        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.showValidationErrors = false;

        $scope.$watch('data.componentName', function (newVal) {
            if ($scope.wizardForm && $scope.wizardForm.agent.$pristine && newVal) {
                newVal = ( /^[^a-zA-Z].*/.test(newVal) ? 'agent_' : '' ) + newVal;
                $scope.data.agentName = newVal.replace(/[^_a-zA-Z0-9]/g, '_');
            }
        });

        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });

    }
});
