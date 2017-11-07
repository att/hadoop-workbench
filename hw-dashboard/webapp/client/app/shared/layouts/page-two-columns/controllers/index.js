/*jshint maxcomplexity: 7*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('layouts.PageTwoColumnsController', Controller);

    Controller.$inject = ['$scope', '$widgetParams'];
    function Controller($scope, $widgetParams) {
        ng.extend($scope, {
            page: $widgetParams.page,
            splitContainers: false
        });

        $scope.resizeConfig = {
            handles: 'w',
            minWidth: 400,
            maxWidth: 1300
        };

        $scope.$watch(function () {
            $scope.splitContainers = false;
            $scope.page.leftTabs.forEach(function (leftTab) {
                if (leftTab.active) {
                    leftTab.page.rightTabs.forEach(function (rightTab) {
                        if (rightTab.active) {
                            $scope.splitContainers = true;
                        }
                    });
                }
            });
        });
    }
});
