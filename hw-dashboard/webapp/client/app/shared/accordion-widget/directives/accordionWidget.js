define(function (require) {
    "use strict";

    var angular = require("angular");

    require("../ngModule").directive("accordionWidget", accordionWidget);

    function accordionWidget() {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            template: '<div ng-transclude class="b-accordion-widget"></div>',
            controller: "dap.shared.accordionWidgetController",
            scope: {
                itemClickHandler: "=",
                expandAllTabsIfNotEmpty: "="
            }
        };
    }
});