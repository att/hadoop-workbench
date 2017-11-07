define(function (require) {
    "use strict";

    var angular = require("angular");

    require("../ngModule").directive("pane", pane);

    function pane() {
        return {
            restrict: 'EA',
            transclude: true,
            require: '^accordionWidget',
            replace: true,
            template: '<div ng-transclude class="b-accordion-widget__pane"></div>',
            controller: ["$scope", function ($scope) {
                this.isPaneExpanded = function () {
                    return $scope.expanded;
                };

                this.togglePane = function () {
                    $scope.$broadcast("togglePane", !$scope.expanded);
                };
            }],
            link: function (scope, element, attributes, accordionWidgetController) {
                scope.expanded = false;

                // scope of pane is shared with accordionWidgetController and it's expanded from there
                accordionWidgetController.addPane(scope);

                scope.$on("$destroy", function () {
                    accordionWidgetController.removePane(scope);
                });

                scope.$on("togglePane", function ($event, expand) {
                    if (expand) {
                        accordionWidgetController.expandPane(scope);
                    } else {
                        accordionWidgetController.collapsePanes();
                    }
                });
            }
        };
    }
});