define(function (require) {
    "use strict";

    require('../ngModule').directive('focusCatcher', ['$parse', 'core.focusCatcherService', function ($parse, focusCatcherService) {
        return {
            restrict: 'A',
            /**
             * `?^^` - Attempt to locate the required controller by searching the element's parents,
             *          __excluding__ current element
             *  or pass `null` to the `link` fn if not found.
             */
            require: '?^^focusCatcher',
            link: function (scope, element, attrs, parentFocusCatcherController) {
                var getter = $parse(attrs.focusCatcher);
                var isLast = !parentFocusCatcherController;
                focusCatcherService.register(getter(scope), isLast);

                // $dashboardWidget not used in this place, but used in "dashboard.indexController"
                scope.$on('focus-catcher.bubbled-click', function(event, $dashboardWidget) {
                    focusCatcherService.register(getter(scope), isLast);
                });

                element.on('click', function () {
                    focusCatcherService.register(getter(scope), isLast);
                });
            },
            controller: function () {
                // empty
            }
        };
    }]);
});

