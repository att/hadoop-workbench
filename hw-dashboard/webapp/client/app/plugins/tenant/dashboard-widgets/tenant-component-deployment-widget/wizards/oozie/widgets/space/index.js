define(function (require) {
    "use strict";

    require('../../ngModule').controller('deploy-component.wizards.oozie.spaceController', spaceController);

    spaceController.$inject = [
        '$scope',
        '$widgetParams',
        'spaces'
    ];

    function spaceController($scope, $widgetParams, spaces) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.searchString = '';
        $scope.spacesFiltered = [];
        $scope.spaces = spaces;
        $scope.selectSpace = function (space) {
            $scope.data.env = space;
            $scope.$emit('next-step.deploy-component-service');
        };
        $scope.$watch('searchString', function (searchString) {
            var list = $scope.spaces.filter((space) =>
                space.toLowerCase().includes(searchString.toLowerCase())
            );
            $scope.spacesFiltered.splice(0);
            $scope.spacesFiltered.push.apply($scope.spacesFiltered, list);
        });

        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });

    }
});
