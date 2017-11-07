import {TYPE_CDH, TYPE_HDP} from '../../../../../../../../plugins/platform/constants/platform-types';
define(function (require) {
    "use strict";

    require('../../ngModule').controller('deploy-component.wizards.base.platformController', platformController);

    platformController.$inject = [
        '$scope',
        '$widgetParams',
        'platforms',
        '$filter'
    ];
    function platformController($scope, $widgetParams, platforms, $filter) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.searchString = '';
        $scope.platforms = platforms || [];
        $scope.platformsFiltered = filterOutNonHadoopPlatforms();

        $scope.selectPlatform = function (platform) {
            $scope.data.platform = platform;
            $scope.$emit('next-step.deploy-component-service');
        };

        $scope.title = function () {
            return "Select platform";
        };

        $scope.$watch('searchString', function (searchString) {
            $scope.platformsFiltered = filterOutNonHadoopPlatforms(searchString);
        });

        $scope.showValidationErrors = false;

        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });

        let {deploymentDescriptor: {platformId: preselectedPlatformId = false} = {}} = $scope.data;
        let [preselectedPlatform = false] = platforms.filter(({id}) => id === preselectedPlatformId);
        if (preselectedPlatformId !== false) {
            $scope.selectPlatform(preselectedPlatform);
        }

        function filterOutNonHadoopPlatforms(searchString) {
            if (searchString) {
                return $scope.platforms.filter(function (platform) {
                    return ( (platform.type == TYPE_CDH || platform.type == TYPE_HDP) && platform.title.search(new RegExp(searchString, "i")) !== -1);
                });
            } else {
                return $scope.platforms.filter(function (platform) {
                    return (platform.type == TYPE_CDH || platform.type == TYPE_HDP);
                });
            }
        }
    }
});
