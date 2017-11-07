define(function (require) {
    "use strict";

    var ng = require("angular");
    require("../ngModule").controller("dap.shared.accordionWidgetController", AccordionWidgetController);

    AccordionWidgetController.$inject = ["$scope"];

    function AccordionWidgetController($scope) {
        var panes = [];

        this.addPane = function (pane) {
            if ($scope.expandAllTabsIfNotEmpty) {
                pane.expanded = true;
            }
            panes.push(pane);
        };

        this.removePane = function (pane) {
            panes.some(function (element, index) {
                if (pane === element) {
                    panes.splice(index, 1);
                    return true;
                }
            });
        };

        this.collapsePanes = function () {
            ng.forEach(panes, function (iteratedPane) {
                iteratedPane.expanded = false;
            });
        };

        this.expandPane = function (paneToExpand) {
            ng.forEach(panes, function (iteratedPane) {
                iteratedPane.expanded = paneToExpand === iteratedPane;
            });
        };

        $scope.$watch("expandAllTabsIfNotEmpty", function (value) {
            if (value && value.length > 0) {
                expandAllTabs();
            } else {
                collapseAllTabs();
            }
        });

        function expandAllTabs() {
            ng.forEach(panes, function (iteratedPane) {
                iteratedPane.expanded = true;
            });
        }

        function collapseAllTabs() {
            ng.forEach(panes, function (iteratedPane) {
                iteratedPane.expanded = false;
            });
        }

    }

});