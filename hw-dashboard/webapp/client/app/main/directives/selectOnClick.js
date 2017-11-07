define(function (require) {
    "use strict";

    require('../ngModule').directive('selectOnClick', function () {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.on('click', function () {
                    this.select();
                });
            }
        };
    });
});