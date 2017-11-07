define(function (require) {
    "use strict";

    /**
     * Attribute "focus-it-set-caret-to-end" forces setting caret to the end of input field
     * focus-it-delay run focus on next tick;
     */
    require('../ngModule').directive('focusIt', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var isSetToEnd = attrs.focusItSetCaretToEnd;
                var isDelay = attrs.focusItDelay;
                scope.$watch(attrs.focusIt, function (newVal, oldVal) {
                    var callerFn;
                    if (isDelay) {
                        callerFn = function (cb) {
                            $timeout(cb);
                        };
                    } else {
                        callerFn = function (cb) {
                            cb();
                        }
                    }

                    if (newVal) {
                        if (isSetToEnd) {
                            callerFn(function () {
                                focusAndSetCaretToEnd(element)
                            });
                        } else {
                            callerFn(function () {
                                element.focus();
                            })
                        }
                    }
                });

                /**
                 * Set caret position to the end of passed dom-element
                 *  dom-element is element[0]
                 *
                 * @param {object} el
                 */
                function focusAndSetCaretToEnd(el) {
                    var textElement = el && el[0] && el[0].childNodes && el[0].childNodes[0];

                    if (!textElement) {
                        if (el) {
                            el.focus();
                        }
                        return;
                    }
                    var range = window.document.createRange();
                    var sel = window.getSelection();
                    el.focus();
                    range.setStart(el[0].childNodes[0], el[0].childNodes[0].length);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    el.focus();
                }
            }
        };
    }]);
});
