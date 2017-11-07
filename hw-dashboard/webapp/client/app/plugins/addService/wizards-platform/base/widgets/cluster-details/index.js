define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../../ngModule').controller('platform-wizard-base.clusterDetailsController', clusterDetailsController);

    clusterDetailsController.$inject = [
        '$scope',
        '$widgetParams'
    ];
    function clusterDetailsController($scope, $widgetParams) {
        // @TODO: refactor to fetch regions from server
        var regions = [
            {
                "value": "us-east-1",
                "title": "US East (N. Virginia)"
            },
            {
                "value": "us-west-2",
                "title": "US West (Oregon)"
            },
            {
                "value": "us-west-1",
                "title": "US West (N. California)"
            },
            {
                "value": "eu-west-1",
                "title": "EU (Ireland)"
            },
            {
                "value": "eu-central-1",
                "title": "EU (Frankfurt)"
            },
            {
                "value": "ap-southeast-1",
                "title": "Asia Pacific (Singapore)"
            },
            {
                "value": "ap-northeast-1",
                "title": "Asia Pacific (Tokyo)"
            },
            {
                "value": "ap-southeast-2",
                "title": "Asia Pacific (Sydney)"
            },
            {
                "value": "ap-northeast-2",
                "title": "Asia Pacific (Seoul)"
            },
            {
                "value": "ap-south-1",
                "title": "Asia Pacific (Mumbai)"
            },
            {
                "value": "sa-east-1",
                "title": "South America (São Paulo)"
            }
        ];
        $scope.data = $widgetParams.data;
        $scope.regions = regions;
        $scope.stepNumber = $widgetParams.stepNumber;

        $scope.$watch('data.awsRegion', function (newRegion) {
            $scope.data['awsRegionTitle'] = getTitleForRegion(newRegion);
        });
        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });

        function getTitleForRegion(regionValue) {
            let [{title: newRegionTitle}] = $scope.regions.filter(
                (region) => (region.value == regionValue));
            return newRegionTitle
        }
    }
});
