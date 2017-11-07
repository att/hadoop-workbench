define(function (require) {
    "use strict";

    require('../ngModule').directive('autocompletablePartOfInput', autocomplete);

    autocomplete.$inject = [
        '$timeout',
        '$rootScope',
        'core.utils',
    ];
    function autocomplete($timeout, $rootScope, utils) {
        return {
            restrict: "A",
            scope: {
                model: "=acModel",                             // [IN/OUT] [changeable] {string | null | undefined}
                applyAutocompletableValueCb: "=acApplyAutocompletableValueCb", // [OUT]
                substituteWithValue: "=acSubstituteWith",      // [IN] [changeable]        {false} || {string}
                config: "=acPatternConfig",                  // [IN] [const]        {object}
                isEnabled: "=acIsEnabled",                  // [IN] [changeable]        {boolean}
            },
            require: 'ngModel',

            /*
             * s0 focus set on element // isEnabled should be set to true by outer user
             * s1 model changed <by user / outer ctrl>
             * s2 call applyAutocompletableValueCb with ("false" or "string") <by directive>
             * s3 substituteWithValue changed <by outer ctrl> , $watch this and do s4
             * s4 model changed <by directive> /// finish
             */
            link: function (scope, element, attrs, ngModelCtrl) {
                var autocompleteObj = scope.config;

                var focusedElement = element;
                var isModelBeenWatched = true;
                var autocompleteContainer = {
                    caretPosition: 0,
                    stringToAutocomplete: '',
                    leftFromStringToAutocomplete: '',
                    rightFromStringToAutocomplete: '',
                    autocompletableValue: false,
                };

                var lastKnownRawValue = false;

                setupDOMEventListeners();

                function setupDOMEventListeners() {
                    [
                        // {
                        //     eventName: 'click',
                        //     cb: itemInputOnClick
                        // },
                        // {
                        //     eventName: 'keydown',
                        //     cb: itemInputOnKeyDown
                        // },
                        {
                            eventName: 'focus',
                            cb: itemInputFocus
                        },
                        // {
                        //     eventName: 'blur',
                        //     cb: itemInputOnBlur
                        // },
                        // {
                        //     eventName: 'paste',
                        //     cb: itemInputOnPaste
                        // }
                    ].forEach(function (action) {
                        element.on(action.eventName, function (event) {
                            if (forceAsyncEvents[action.eventName] && $rootScope.$$phase) {
                                scope.$evalAsync(action.cb(event));
                            } else {
                                scope.$apply(action.cb(event));
                            }
                        });
                    })
                }

                // For events that might fire synchronously during DOM manipulation
                // we need to execute their event handlers asynchronously using $evalAsync,
                // so that they are not executed in an inconsistent state.
                var forceAsyncEvents = {
                    'blur': true,
                    'focus': true
                };

                function itemInputFocus() {

                    evaluateCurrentState(scope.model, autocompleteContainer);

                    enableModelWatcher();
                    enableSubstituteWithValueWatcher();
                }

                var isSubstituteWithValueBeenWatched = false;

                ngModelCtrl.$viewChangeListeners.push(function () {
                    if (scope.isEnabled && isModelBeenWatched) {
                        evaluateCurrentState(ngModelCtrl.$modelValue, autocompleteContainer);
                    }
                });

                scope.$watch('substituteWithValue', function (newSubstituteWithValue, oldSubstituteWithValue) {

                    if (scope.isEnabled && isSubstituteWithValueBeenWatched) {
                        if (oldSubstituteWithValue == newSubstituteWithValue) {
                            return;
                        }
                        if (autocompleteContainer.autocompletableValue === false) {
                            return;
                        }
                        selectItemNewValue(newSubstituteWithValue);
                    }
                });

                function enableModelWatcher() {
                    isModelBeenWatched = true;
                }

                function enableSubstituteWithValueWatcher() {
                    isSubstituteWithValueBeenWatched = true;
                }

                function disableModelWatcher() {
                    isModelBeenWatched = false;
                }

                function disableSubstituteWithValueWatcher() {
                    isSubstituteWithValueBeenWatched = false;
                }

                function selectItemNewValue(substituteValue) {
                    var newValue = getFullySubstitutedValue(substituteValue, autocompleteContainer);

                    scope.model = newValue;
                    var newCaretPosition = newValue.length - autocompleteContainer.rightFromStringToAutocomplete.length;
                    if (focusedElement) {
                        var previousFocusedElement = focusedElement;
                        $timeout(function () {
                            utils.setCaretPosition(previousFocusedElement, newCaretPosition);
                        });
                    }
                    resetAutocompleteContainer();
                    scope.applyAutocompletableValueCb(false);
                }

                function getFullySubstitutedValue(newSubstituteValue, acContainer) {
                    var endAutocompleteSeparator = autocompleteObj.end;
                    var padding = endAutocompleteSeparator;
                    if (endAutocompleteSeparator.length) {
                        if (acContainer.rightFromStringToAutocomplete.length >= endAutocompleteSeparator.length) {
                            if (acContainer.rightFromStringToAutocomplete.substring(0, endAutocompleteSeparator.length) == endAutocompleteSeparator) {
                                padding = "";
                            }
                        }
                    }
                    return acContainer.leftFromStringToAutocomplete + newSubstituteValue + padding + acContainer.rightFromStringToAutocomplete;
                }


                function evaluateCurrentState(rawValue, acContainer) {
                    if (!focusedElement) {
                        return false;
                    }
                    if (lastKnownRawValue == rawValue) {
                        return false;
                    }
                    lastKnownRawValue = rawValue;
                    var usedRawValue = (rawValue === null || rawValue === undefined) ? '' : rawValue;
                    var caretPosition = utils.getCaretPosition(focusedElement);

                    var leftFromCaretRawValue = getLeftFromCaretRawValue(usedRawValue, caretPosition);
                    var autocompletableValue = getAutocompletableValue(leftFromCaretRawValue);
                    var stringToAutocomplete = autocompletableValue || "";

                    acContainer.caretPosition = caretPosition;
                    acContainer.autocompletableValue = autocompletableValue;
                    acContainer.stringToAutocomplete = stringToAutocomplete;
                    acContainer.leftFromStringToAutocomplete = usedRawValue.substring(0, caretPosition - stringToAutocomplete.length);
                    acContainer.rightFromStringToAutocomplete = usedRawValue.substring(caretPosition);

                    scope.applyAutocompletableValueCb(acContainer.autocompletableValue);
                }


                function getLeftFromCaretRawValue(rawValue, caretPosition) {
                    rawValue = '' + rawValue;
                    return rawValue.substr(0, caretPosition);
                }

                /**
                 * Return "false" if autocomplete is not needed
                 * or "" | "a" | "abc" string if where is a string to autocomplete
                 *
                 * @param {string} leftFromCaretRawValue
                 * @returns {boolean|string}
                 */
                function getAutocompletableValue(leftFromCaretRawValue) {
                    var startSequenceStr = autocompleteObj.start || "";
                    var endSequenceStr = autocompleteObj.end || "";

                    /**
                     * Just autocomplete whole string
                     */
                    if (startSequenceStr.length == 0) {
                        return leftFromCaretRawValue;
                    }

                    /**
                     * Have some restrictions like {{.... }} ,  or ${ ... }
                     */
                    if (leftFromCaretRawValue.length < startSequenceStr.length) {
                        return false;
                    } else if (leftFromCaretRawValue.length == startSequenceStr.length) {
                        return leftFromCaretRawValue == startSequenceStr ? "" : false;
                    } else {
                        var startSequenceRegex = new RegExp(autocompleteObj.startRegexEscaped);
                        var endSequenceRegex = new RegExp(autocompleteObj.endRegexEscaped);
                        var leftStartSplitArray = leftFromCaretRawValue.split(startSequenceRegex);
                        /**
                         * Examples:
                         * str = "beforePatternStr"
                         * str = "beforePatternStr<PATTERN>"
                         * str = "beforePatternStr<PATTERN>afterPatternStr1<PATTERN>afterPatternStr2<PATTERN>afterPatternStr3"
                         */
                        if (leftStartSplitArray.length === 1) {
                            /**
                             * str = "beforePatternStr"
                             * converts into > ["beforePatternStr"]
                             * So, no result was found, only original string,
                             */
                            return false;
                        }
                        if (leftStartSplitArray.length > 1) {
                            /**
                             * Case got some results, taking last "afterPatternStr"
                             * str = "beforePatternStr<PATTERN>"
                             * converts into > ["beforePatternStr", ""]
                             * str = "beforePatternStr<PATTERN>afterPatternStr1<PATTERN>afterPatternStr2<PATTERN>afterPatternStr3"
                             * converts into >  ["beforePatternStr", "afterPatternStr1", "afterPatternStr2", "afterPatternStr3"]
                             */
                            var lastPossibleCorrectString = leftStartSplitArray[leftStartSplitArray.length - 1];
                            var isPatternClosedWithEndSequence = endSequenceRegex.test(lastPossibleCorrectString);
                            if (isPatternClosedWithEndSequence) {
                                return false;
                            } else {
                                return lastPossibleCorrectString;
                            }
                        }
                    }
                }


                function resetAutocompleteContainer() {
                    autocompleteContainer.caretPosition = 0;
                    autocompleteContainer.stringToAutocomplete = '';
                    autocompleteContainer.leftFromStringToAutocomplete = '';
                    autocompleteContainer.rightFromStringToAutocomplete = '';
                }

            }
        };

    }
});