define(function (require) {
    "use strict";

    require('../ngModule').directive('dashboardWidgetSize', directive);

    directive.$inject = ['dap.core.config', '$parse'];
    function directive(dapConfig, $parse) {
        return {
            restrict: 'A',
            compile: function (tElement, tAttrs, $transclude) {
                return function (scope, $element, attrs) {
                    scope.widget = $parse(attrs.dashboardWidgetSize)(scope);
                    scope.$watch('widget.fullWidth', function (fullWidth, oldFullWidth) {
                        if (fullWidth) {
                            $element.addClass('dashboard-col-max');
                        } else {
                            $element.removeClass('dashboard-col-max');
                        }

                        var isInitialRun = fullWidth === oldFullWidth;
                        if (!isInitialRun) {
                            scope.$emit('widgetHasBeenChanged', scope.widget);
                        }
                    });

                    scope.$watch('widget.hSize', function (hSize, oldHSize) {
                        $element.css('height', hSize * 136);

                        var isInitialRun = hSize === oldHSize;
                        if (!isInitialRun) {
                            scope.$emit('widgetHasBeenChanged', scope.widget);
                        }
                    });

                    scope.$watch('widget.wSize', function (wSize, oldWSize) {
                        $element.css('width', wSize * 136);
                        //$element.removeClass('dashboard-col-' + oldWSize);
                        //$element.addClass('dashboard-col-' + wSize);

                        var isInitialRun = wSize === oldWSize;
                        if (!isInitialRun) {
                            scope.$emit('widgetHasBeenChanged', scope.widget);
                        }
                    });
                };
            }
        };
    }
});
