define(function (require) {
    "use strict";

    require('../../ngModule').controller('deploy-component.wizards.oozie.pathController', pathController);

    pathController.$inject = [
        '$scope',
        '$widgetParams'
    ];
    function pathController($scope, $widgetParams) {
        let fileManagerEvents = $scope.fileManagerEvents = $scope.$new(true);
        $scope.data = $widgetParams.data;
        $scope.src = {
            cluster: $scope.data.cluster,
            platform: $scope.data.platform
        };
        fileManagerEvents.$on('path-updated', (event, path) => {
            $scope.data.path = path;
        });
        fileManagerEvents.$on('create-item-mode-change', (event, enabled) => {
            $scope.data.isDisabledState = enabled;
        });
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.onSubmit = function () {
            if ($scope.wizardForm.$valid) {
                $scope.$emit('next-step.deploy-component-service');
            }
        };
    }
});
