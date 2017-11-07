define(function (require) {
    "use strict";

    require('../ngModule').constant('core.makeActionCreator', function (type) {
        var argNames = Array.prototype.slice.call(arguments, 1);
        return function () {
            var args = arguments;
            var action = {
                type: type
            };
            argNames.forEach(function (arg, index) {
                action[argNames[index]] = args[index];
            });
            return action;
        };
    });
});
