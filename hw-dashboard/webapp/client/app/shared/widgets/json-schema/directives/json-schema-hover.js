define(function (require) {
    "use strict";

    require('../ngModule').directive('jsonSchemaHover', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('mouseover', function (event) {
                    event.stopPropagation();
                    var className = $parse(attrs.jsonSchemaHover)(scope);
                    if (typeof className === 'string') {
                        element.addClass(className);
                    }
                });
                element.on('mouseout', function (event) {
                    event.stopPropagation();
                    var className = $parse(attrs.jsonSchemaHover)(scope);
                    if (typeof className === 'string') {
                        element.removeClass(className);
                    }
                });
            }
        };
    }]);
});
