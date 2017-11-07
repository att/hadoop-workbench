define(function (require) {
    "use strict";

    require('../ngModule').directive('calcTabPanelWidth', directive);

    var $ = require("jquery");

    directive.$inject = ["$timeout"];
    function directive($timeout) {
        return {
            restrict: 'A',
            compile: function (tElem) {
                return function (scope, $element, attrs) {
                    var hiddenTabsListControlClass = attrs.ctpwHiddenTabsListControl;
                    if (!hiddenTabsListControlClass) {
                        return;
                    }

                    scope.$on("widget-resize-start", function (event) {
                        $element.hide();
                    });

                    scope.$on("widget-resize-stop", function (event) {
                        $element.show();
                    });

                    scope.$on("left-tabs-changed", function () {
                        // this event is fired when tabs are added to the scope,
                        // but we need to wait until they are added to the DOM using ng-repeat
                        $timeout(function () {
                            calculateWidth();
                        });
                    });
                    scope.$on("dashboard-width-changed", calculateWidth);

                    function calculateWidth() {
                        // first parent is dap-widget, so we need to go 2 levels up
                        var dapWidgetWrapper = $element.parent();
                        var container = dapWidgetWrapper.parent();
                        var totalWidth = container.get(0).offsetWidth;
                        var elementSiblings = container.children().not(dapWidgetWrapper);
                        var width = 0;
                        elementSiblings.each(function () {
                            width += $(this).outerWidth(true);
                        });
                        scope.tabPanelWidth = totalWidth - width;
                        $element.css({width: scope.tabPanelWidth});
                    }
                };
            }
        };
    }
});
