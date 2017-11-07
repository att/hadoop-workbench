define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').directive('coverPassword', getCoverPassword);

    getCoverPassword.$inject = ['$window'];
    function getCoverPassword($window) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                coverPasswordShowPassword: '=',
                inputData: '='
            },
            link: function (scope, element, attr, ngModel) {
                var pastedText = null;
                var range = $window.document.createRange();
                var HIDE_SYMBOL = '●'; // '&#x25cf;';

                range.selectNode(element.get(0));
                ngModel.$formatters.push(function (input) {
                    var inputString = String(input);
                    return scope.coverPasswordShowPassword ? inputString : maskString(inputString);
                });

                ngModel.$parsers.push(function (input) {
                    var inputString = String(input);
                    if (!pastedText) {
                        var regexString = new RegExp(HIDE_SYMBOL, 'g');
                        pastedText = inputString.replace(regexString, '');
                    }

                    var newValue = getNewValueOnPasteEvent(scope.inputData, ngModel.$viewValue, pastedText);
                    pastedText = null;

                    forceRender(inputString);
                    if (!scope.coverPasswordShowPassword) {
                        setCaretToEndIfElementIsFocused(element[0]);
                    }
                    return newValue;
                });

                scope.$watch(function () {
                    return scope.coverPasswordShowPassword;
                }, function () {
                    forceRender(scope.inputData);
                    if (scope.coverPasswordShowPassword) {
                        setCaretToEndIfElementIsFocused(element[0]);
                    }

                });

                element.bind('paste', function (event) {
                    pastedText = event.originalEvent.clipboardData.getData('text/plain');
                });

                function forceRender(stringToRender) {
                    ngModel.$setViewValue(
                        scope.coverPasswordShowPassword ? stringToRender : maskString(stringToRender)
                    );
                    ngModel.$render();
                }

                /**
                 *  Fetch real input from masked input
                 *  eg value = "abcdef"
                 *  view =      "******"
                 *  paste text = "zzz"
                 *  view = 1) "******zzz" ,  2) "***zzz***"
                 *  calculated value 1) "abcdef",  2) "abczzzefg"
                 *
                 * @param {string} value
                 * @param {string} viewValue
                 * @param {string} pasteStr
                 * @returns {string}
                 */
                function getNewValueOnPasteEvent(value, viewValue, pasteStr) {
                    if (!value) {
                        value = '';
                    }
                    if (!viewValue) {
                        viewValue = '';
                    }
                    var pastePositionStart = viewValue.lastIndexOf(pasteStr);
                    var pastePositionEnd = pastePositionStart + pasteStr.length;
                    var suffixViewLength = viewValue.length - pastePositionEnd;
                    var prefixValueStr = value.substring(0, pastePositionStart);
                    var suffixValueStr = value.substring(value.length - suffixViewLength);

                    return prefixValueStr + pasteStr + suffixValueStr;
                }

                /**
                 * Mask string with HIDE_SYMBOL
                 *
                 * @param {string} inputString
                 * @returns {*}
                 */
                function maskString(inputString) {
                    if (!inputString) {
                        inputString = '';
                    }
                    return inputString.replace(/./g, HIDE_SYMBOL);
                }

                /**
                 * Set caret position to the end of passed dom-element
                 *
                 * @param {object} el
                 */
                function setCaretToEndIfElementIsFocused(el) {

                    if (el !== $window.document.activeElement) {
                        return;
                    }
                    var textElement = el.childNodes[0];
                    if (!textElement) {
                        return;
                    }
                    var range = $window.document.createRange();
                    var sel = $window.getSelection();
                    el.focus();
                    range.setStart(el.childNodes[0], el.childNodes[0].length);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    el.focus();
                }
            }
        };
    }


});