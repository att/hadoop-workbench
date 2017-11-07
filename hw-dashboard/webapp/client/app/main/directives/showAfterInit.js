define(function (require) {
    "use strict";

    require('../ngModule').directive('dapShowAfterInit', showAfterInit);

    function showAfterInit() {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.removeClass('hide-before-init');
            }
        };
    }
});