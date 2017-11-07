/*jshint maxcomplexity: 7*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('layouts.TabPagesController', Controller);

    Controller.$inject = ['$scope', '$widgetParams'];
    function Controller($scope, $widgetParams) {
        $scope.tabs = $widgetParams.widget.tabManager.getTabs();
        $scope.leftTabClicked = function (event, index, hostTab, clickedTab) {
            var currentActiveIndex = hostTab.page.leftTabManager.getActive();
            if (currentActiveIndex !== index && false) {
                var nextTab = hostTab.page.leftTabs[index];
                if (nextTab && nextTab.page) {
                    nextTab.page.reset();
                }
            }
            hostTab.page.leftTabManager.setActive(index);
        };
        $scope.rightTabClicked = function (event, index, hostTab, clickedTab) {
            var currentActiveIndex = hostTab.page.rightTabManager.getActive();
            if (currentActiveIndex !== index && false) {
                var nextTab = hostTab.page.rightTabs[index];
                if (nextTab && nextTab.page) {
                    nextTab.page.reset();
                }
                hostTab.page.rightTabManager.setActive(index);
            }
            hostTab.page.rightTabManager.setActive(index);
        };

        $scope.hideRightPanel = function (leftTab) {
            leftTab.page.rightTabManager.setActive(-1);
        };

        $widgetParams.widget.tabManager.on("tabs-change", function (event, tabs) {
            $scope.tabs = tabs;
        });
    }
});
