define(function (require) {
    "use strict";

    require('jqueryUi');
    require('../ngModule').directive('resizable', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function postLink(scope, elem, attrs) {
                var callbackStart = $parse(attrs.resizableCallbackStart)(scope);
                var callbackStop = $parse(attrs.resizableCallbackStop)(scope);
                var resizableConfig = $parse(attrs.resizable)(scope);
                var resizableContext = $parse(attrs.resizableContext)(scope);
                elem.resizable(resizableConfig);

                elem.on('resizestart', function (event, options) {
                    // prevent start callback triggering on elem resizable parents
                    event.stopPropagation();
                    if (callbackStart) {
                        scope.$evalAsync(function () {
                            callbackStart.call(null, resizableContext, options);
                        });
                    }
                });

                elem.on('resizestop', function (event, options) {
                    // prevent stop callback triggering on elem resizable parents
                    event.stopPropagation();
                    if (callbackStop) {
                        scope.$evalAsync(function () {
                            callbackStop.call(null, resizableContext, options);
                        });
                    }
                });
            }
        };
    }]);
});
