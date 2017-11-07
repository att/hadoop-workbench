define(function (require) {
    "use strict";

    var angular = require("angular");

    require("../ngModule").directive('onKeyEnterCallback', onKeyEnterCallback);
    
    onKeyEnterCallback.$inject = ["$parse", "safeApply"];

    function onKeyEnterCallback($parse, safeApply) {
        return {
            compile: function (element, attrs) {
                var callback = $parse(attrs.onKeyEnterCallback);

                return function (scope, element) {
                    element.on('keydown keypress', function (e) {
                        if (e.which === 13) {
                            e.preventDefault();
                            safeApply(scope, callback);
                        }
                    });
                };
            }
        }
    }
});