define(function (require) {
    "use strict";

    require('../../ngModule').controller('deploy-component.wizards.flume.componentNameController', componentNameController);

    componentNameController.$inject = [
        '$scope',
        '$widgetParams'
    ];
    function componentNameController($scope, $widgetParams) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.data['flume-component'] = getValidName($scope.data.componentDescriptor.info.name);
        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });
    }

    function getValidName(name) {
        let validName;
        validName = name.replace('-', '_').replace(' ', '_');
        if (!isNaN(validName.charAt(0))) {
            validName = '_' + validName;
        }
        return validName;
    }
});