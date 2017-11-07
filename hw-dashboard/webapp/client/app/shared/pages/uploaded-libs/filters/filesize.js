define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').filter('filesizeFilter', getFileSizeFilter);

    function getFileSizeFilter() {
        return function (bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
                return '-';
            }

            if (typeof precision === 'undefined') {
                precision = 1;
            }

            var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));

            /**
             * No precision for bytes
             */
            if (number == 0) {
                precision = 0;
            }
            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
        }
    }
});


