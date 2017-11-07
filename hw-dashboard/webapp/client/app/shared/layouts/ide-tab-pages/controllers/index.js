/*jshint maxcomplexity: 7*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('layouts.IdeTabPagesController', Controller);

    Controller.$inject = ['$scope', '$widgetParams'];
    function Controller($scope, $widgetParams) {
        ng.extend($scope, {
            widget: $widgetParams.widget,
            leftTabs: $widgetParams.widget.leftTabManager.getTabs(),
            tabs: $widgetParams.widget.tabManager.getTabs(),
            splitContainers: false,
            resizeConfig: {
                handles: 'e',
                minWidth: 300,
                maxWidth: 1300
            }
        });

        $scope.$watch(function () {
            $scope.splitContainers = $scope.leftTabs.some(function (t) {
                return t.active;
            });
        });

        $widgetParams.widget.tabManager.on("tabs-change", function (event, tabs) {
            $scope.tabs = tabs;
        });
    }
});
