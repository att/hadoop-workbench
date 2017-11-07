define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').directive('clickOutside', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var fn = scope[attrs.clickOutside] || ng.noop;
                ng.element(document).on('mousedown', function (event) {
                    if (!ng.element(event.target).closest(element).length) {
                        scope.$apply(fn);
                    }
                });
            }
        };
    });
});
