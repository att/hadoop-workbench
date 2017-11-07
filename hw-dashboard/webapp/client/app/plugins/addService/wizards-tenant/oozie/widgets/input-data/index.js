define(function (require) {
    "use strict";

    require('../../ngModule').controller('addService.wizards-tenant.oozie.inputDataController', inputDataController);

    inputDataController.$inject = [
        '$scope',
        '$widgetParams'
    ];
    function inputDataController($scope, $widgetParams) {
        $scope.data = $widgetParams.data;

        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.showValidationErrors = false;

        $scope.$watch('data.componentName', function (newVal, o) {
            if ($scope.wizardForm && $scope.wizardForm.workflow.$pristine && newVal) {
                newVal = ( /^[^a-zA-Z_].*/.test(newVal) ? 'workflow_' : '' ) + newVal;
                $scope.data.workflowName = newVal.replace(/[^a-zA-Z_0-9-]/g, '_');
            }
        });

        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });

    }

});
