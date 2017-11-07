define(function (require) {
    "use strict";

    var angular = require("angular");

    require("../ngModule").directive("paneContent", paneContent);

    function paneContent() {
        return {
            restrict: 'EA',
            require: '^pane',
            transclude: true,
            replace: true,
            template: '<div ng-transclude class="b-accordion-widget__pane-content" ng-show="expanded"></div>',
            link: function (scope, element, attributes, paneController) {
                scope.expanded = false;

                scope.$watch(function () {
                    return paneController.isPaneExpanded();
                }, function (value) {
                    scope.expanded = value === true;
                });
            }
        };
    }
});