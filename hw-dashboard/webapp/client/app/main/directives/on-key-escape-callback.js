define(function (require) {
    "use strict";

    var angular = require("angular");

    require("../ngModule").directive('onKeyEscapeCallback', onKeyEscapeCallback);

    onKeyEscapeCallback.$inject = ["$parse", "safeApply"];

    function onKeyEscapeCallback($parse, safeApply) {
        return {
            compile: function (element, attrs) {
                var callback = $parse(attrs.onKeyEscapeCallback);

                return function (scope, element) {
                    element.on('keydown keypress', function (e) {
                        if (e.which === 27) {
                            e.preventDefault();
                            safeApply(scope, callback);
                        }
                    });
                };
            }
        }
    }
});