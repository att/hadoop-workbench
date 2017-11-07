define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').directive('unique', directive);

    directive.$inject = [
        '$parse'
    ];
    function directive($parse) {
        return {
            require: 'ngModel',
            link: function (scope, elem, attr, ngModel) {
                var field = attr["uniqueField"];

                function isUnique(value, minOccur) {
                    var isValid = true,
                        count = 0;

                    if ("undefined" === typeof(minOccur)) {
                        minOccur = 0;
                    }

                    var targetArray = $parse(attr.unique)(scope) || [];
                    targetArray.forEach(function (el) {
                        var equal = field ? el[field] === value : el === value;
                        if (equal) {
                            count += 1;
                            if (count > minOccur) {
                                isValid = false;
                            }
                        }
                    });

                    return isValid;
                }

                ngModel.$parsers.unshift(function (value) {
                    ngModel.$setValidity('unique', isUnique(value));

                    return value;
                });

                ngModel.$formatters.unshift(function (value) {
                    ngModel.$setValidity('unique', isUnique(value, 1));

                    return value;
                });
            }
        };
    }
});
