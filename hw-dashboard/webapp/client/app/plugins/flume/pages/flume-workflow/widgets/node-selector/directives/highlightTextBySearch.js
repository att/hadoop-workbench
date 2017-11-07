define(function (require) {
    "use strict";

    var ng = require("angular");
    require("../ngModule").directive('highlightTextBySearch', highlightSearch);

    function highlightSearch() {
        return {
            restrict: 'A',
            compile: function (element, attrs) {
                var watchExpression = attrs.highlightTextBySearch;

                return function (scope, element) {
                    if (!ng.isUndefined(watchExpression)) {
                        scope.$watch(watchExpression, function (value) {
                            if (!ng.isUndefined(value) && value !== null) {
                                var text = element.text().trim();
                                var highlightedText = replaceAll(text, encodeHTML(value), '<em>$&</em>');
                                element.html(highlightedText);
                            }
                        });
                    }
                };
            }
        };
    }

    function replaceAll(str, substr, newSubstr) {
        if (!substr) {
            return str;
        }

        var expression = substr.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
        return str.replace(new RegExp(expression, 'gi'), newSubstr);
    }

    function encodeHTML(value) {
        return value.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
});
