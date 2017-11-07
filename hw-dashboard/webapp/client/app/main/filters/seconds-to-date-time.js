define(function (require) {
    "use strict";
    require('../ngModule').filter('secondsToDateTime', [function() {
        return function(seconds) {
            return new Date(1970, 0, 1).setSeconds(seconds);
        };
    }]);
});
