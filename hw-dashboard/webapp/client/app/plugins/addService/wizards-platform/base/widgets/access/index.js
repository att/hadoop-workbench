define(function (require) {
    "use strict";

    require('../../ngModule').controller('platform-wizard-base.accessController', accessController);

    accessController.$inject = [
        '$scope',
        '$widgetParams'
    ];
    function accessController($scope, $widgetParams) {
        $scope.data = $widgetParams.data;

        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.showValidationErrors = false;

        $scope.$watch('data.managerUser', function (newVal, o) {
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
