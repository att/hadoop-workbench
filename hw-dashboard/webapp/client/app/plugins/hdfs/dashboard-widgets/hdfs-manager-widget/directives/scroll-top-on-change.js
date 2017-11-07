define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').directive('scrollTopOnChange', scrollTopOnChange);

    scrollTopOnChange.$inject = ["$parse"];
    function scrollTopOnChange($parse) {
        return {
            compile: function (tElement, tAttrs, transclude) {
                var watcher = $parse(tAttrs['scrollTopOnChange']);
                return function (scope, iElement, iAttrs, controller) {
                    // directive expects collection
                    scope.$watchCollection(watcher, function (items) {
                        if (items && items.length > 0) {
                            // we need to wait for repaint because
                            // for some reason `scrollTop` is 0 on the element before repaint
                            setTimeout(function () {
                                iElement.scrollTop(0);
                            }, 0);
                        }
                    });
                }
            }
        }
    }
});