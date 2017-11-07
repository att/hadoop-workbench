define(function (require) {
    "use strict";

    let ng = require("angular");

    require('../ngModule').directive("multiplePattern", function () {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function (scope, elm, attr, ctrl) {
                if (!ctrl) return;

                let validators = [];
                scope.$watch(attr['multiplePattern'], function (patterns) {
                    if (ng.isObject(patterns) && !ng.isArray(patterns) && Object.keys(patterns).length > 0) {
                        removePreviousValidators();
                        ng.forEach(patterns, (pattern, name) => {
                            let regex = new RegExp(pattern);
                            if (regex && !regex.test) {
                                console.error(`Regexp pattern ${pattern} is ignored`);
                            }
                            let regexp = regex || undefined;
                            var errorName = `mpattern-${name}`;
                            ctrl.$validators[errorName] = (modelValue, viewValue) => {
                                return ctrl.$isEmpty(viewValue) || ng.isUndefined(regexp) || regexp.test(viewValue);
                            };
                            validators.push(errorName);
                        });
                        ctrl.$validate();
                    }
                });

                function removePreviousValidators() {
                    validators.forEach(name => {
                        delete ctrl.$validators[name];
                    });
                    validators.length = 0;
                }
            }
        };
    });
});