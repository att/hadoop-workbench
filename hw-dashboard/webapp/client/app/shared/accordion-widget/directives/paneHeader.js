define(function (require) {
    "use strict";

    var angular = require("angular");

    require("../ngModule").directive("paneHeader", paneHeader);

    function paneHeader() {
        return {
            restrict: 'EA',
            require: '^pane',
            transclude: true,
            replace: true,
            scope: {
                nodeType: "@",
                expanded: "="
            },
            link: function (scope, iElement, iAttrs, paneController) {
                scope.disabled = iAttrs.disabled;

                scope.toggle = function () {
                    if (!scope.disabled) {
                        paneController.togglePane();
                    }
                };
            },
            template: '<div class="b-accordion-widget__pane-header" ng-click="toggle()" ' +
            'ng-class="{\'b-accordion-widget__pane-header_expanded\': expanded, \'b-accordion-widget__pane-header_collapsed\': !expanded, \'b-accordion-widget__pane-header_disabled\': disabled }\">' +
            '<i class="b-accordion-widget__pane-header__icon b-accordion-widget__pane-header__icon-{{nodeType}}"></i>' +
            '<div ng-transclude></div>'
        };
    }
});