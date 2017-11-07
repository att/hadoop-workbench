define(function (require) {
    "use strict";
    var angular = require('angular');
    require('../ngModule').directive('inputAutocompleteSmart', autocomplete);

    autocomplete.$inject = [
        '$compile',
        '$parse',
        '$timeout',
        '$rootScope',
        '$filter',
        'core.utils',
    ];
    function autocomplete($compile, $parse, $timeout, $rootScope, $filter, utils) {
        return {
            restrict: 'A',
            scope: {
                model: "=inputAutocompleteSmart", // [IN/OUT] [changeable] {string | null | undefined}
            },
            /**
             * Other params of this directive:
             *
             *  attrs.inputAutocompleteSmartPatternConfig {Object} [optional Regex Config,  default "{{...}}" ]
             *  attrs.inputAutocompleteSmartIsEnabled  {Boolean} [required   enabled/disabled watchable]
             *  attrs.inputAutocompleteSmartData {Array}   [required  autocomplete list array ]
             */

            require: 'ngModel',

            link: function (scope, element, attrs, ngModelCtrl) {
                var intendedScope = scope.$parent;
                scope.config = angular.extend({}, getDefaultAutocompleteObj(),
                    $parse(attrs.inputAutocompleteSmartPatternConfig)(intendedScope));

                scope.isACPOIEnabled = $parse(attrs.inputAutocompleteSmartIsEnabled)(intendedScope);
                scope.isEnabled = scope.isACPOIEnabled;

                scope.dataAll = $parse(attrs.inputAutocompleteSmartData)(intendedScope);
                scope.data = angular.copy(scope.dataAll);

                scope.autocompleteChannelItem = {};
                angular.extend(
                    scope.autocompleteChannelItem,
                    {
                        isActive: false,
                        applyAutocompletableValueCb: function (value) {
                            return filterAutocompleteDataList(value, scope.autocompleteChannelItem);
                        }
                    }
                );

                scope.substituteWithValue = false;
                scope.applyAutocompletableValueCb = function (value) {
                    return filterAutocompleteDataList(value, scope.autocompleteChannelItem);
                };

                autocompletablePartOfInput();
                scope.onChooseCb = function (datalistItem) {
                    scope.substituteWithValue = datalistItem.key;
                };


                var wrapperId = 'autocomplete-random-' + ('' + Math.random()).slice(2);

                var selectedIndex = -1;
                var isCompiled = false;
                var appendedElement = null;

                scope.$watch(function () {
                    scope.isACPOIEnabled = $parse(attrs.inputAutocompleteSmartIsEnabled)(intendedScope);
                    scope.isEnabled = scope.isACPOIEnabled && scope.autocompleteChannelItem && scope.autocompleteChannelItem.isActive;
                    return scope.isEnabled;
                }, function (newIsEnabledValue) {
                    if (!isCompiled && newIsEnabledValue) {
                        appendAndCompile();

                        isCompiled = true;
                    }
                });

                scope.$watchCollection('data', function () {
                    selectedIndex = -1;
                });

                element.on('keydown', function (event) {
                    var keyCodeUp = 38;
                    var keyCodeDown = 40;
                    var keyCodeEnter = 13;
                    if (event.keyCode === keyCodeUp) {
                        if (selectedIndex <= 0) {
                            setSelectedIndex(scope.data.length - 1);
                        } else {
                            setSelectedIndex(selectedIndex - 1);
                        }
                        return false;
                    }
                    if (event.keyCode === keyCodeDown) {
                        if (selectedIndex >= scope.data.length - 1) {
                            setSelectedIndex(0);
                        } else {
                            setSelectedIndex(selectedIndex + 1);
                        }
                        return false;
                    }
                    if (event.keyCode === keyCodeEnter && selectedIndex > -1) {
                        var selectedModule = scope.data[selectedIndex];
                        if (selectedModule) {
                            chooseElement(selectedModule);
                        }
                        return false;
                    }
                    function setSelectedIndex(index) {
                        selectedIndex = index;

                        scope.$apply(function () {
                            scope.listSelectedIndex = index;
                        });

                    }

                    function chooseElement(item) {
                        scope.$apply(function () {
                            scope.onChooseCb.call(null, item);
                        });
                    }

                });

                scope.$on("$destroy", function () {
                    onDestroy();
                });

                function filterAutocompleteDataList(newVal, autocompleteChannel) {
                    var filteredResults;
                    /**
                     * Show all options if no input was done buy user
                     */
                    if (newVal === null || newVal === false) {
                        filteredResults = [];
                    } else {
                        filteredResults = $filter('filter')(scope.dataAll, {key: newVal});
                    }
                    setNewDataToArrayReference(scope.data, filteredResults);
                    autocompleteChannel.isActive = filteredResults.length;
                }

                function setNewDataToArrayReference(existingArrayReference, newData) {
                    /*
                     * Save pointer to the existing array!
                     */
                    existingArrayReference.splice(0);
                    existingArrayReference.push.apply(existingArrayReference, newData);
                    return existingArrayReference;
                }


                function appendAndCompile() {
                    var template = '<div id="' + wrapperId + '" class="b-autocomplete-wrapper"> \
                        <div \
                             class="b-config-properties-editor__new-item__value" \
                             navigable-list \
                             nl-externally-selected-index="listSelectedIndex" \
                             nl-on-choose="onChooseCb" \
                             ng-if="isEnabled" \
                        > \
                            <ul navigable-list-items="data" \
                                nl-selector="li" \
                                nl-selected-class="selected" \
                                nl-highlighted-class="highlighted"\
                                class="b-autocomplete__list-container__list" \
                            > \
                                <li class="b-autocomplete__list-container__list__item" \
                                    ng-repeat="item in data" \
                                    ng-click="onChooseCb(item)" \
                                > \
                                    {{item.key}} \
                                </li> \
                            </ul> \
                        </div> \
                    </div>';

                    angular.element(document.body).append(template);
                    appendedElement = angular.element('#' + wrapperId);
                    $compile(appendedElement.contents())(scope);
                    positionAppendedAboveOrBelowTarget(appendedElement, element);
                }

                function onDestroy() {
                    angular.element('#' + wrapperId).remove();
                }

                /**
                 *
                 * @param {object} movedElement
                 * @param {object} coreElement
                 */
                function positionAppendedAboveOrBelowTarget(movedElement, coreElement) {
                    movedElement.css({
                        top: -10000 + 'px'
                    });
                    $timeout(function () {
                        var _movedElement = movedElement;
                        var _coreElement = coreElement;
                        return function () {
                            var margin = 2;
                            var bodyRect = document.body.getBoundingClientRect();
                            var coreRect = _coreElement[0].getBoundingClientRect();
                            var movedRect = _movedElement[0].getBoundingClientRect();

                            var isAboveEnougthSpace = coreRect.top + margin > movedRect.height;
                            var isBelowEnougthSpace = bodyRect.bottom > coreRect.bottom + margin + movedRect.height;
                            var isBelow = isBelowEnougthSpace || !isAboveEnougthSpace;
                            var moveTo = {
                                top: (isBelow ? coreRect.bottom + margin : coreRect.top - margin - movedRect.height) + 'px',
                                left: coreRect.left + 'px'
                            };
                            _movedElement.css(moveTo);
                        }
                    }(), 50);
                }


                /*
                 * s0 focus set on element // isACPOIEnabled should be set to true by outer user
                 * s1 model changed <by user / outer ctrl>
                 * s2 call applyAutocompletableValueCb with ("false" or "string") <by directive>
                 * s3 substituteWithValue changed <by outer ctrl> , $watch this and do s4
                 * s4 model changed <by directive> /// finish
                 */
                function autocompletablePartOfInput() {
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


                    // For events that might fire synchronously during DOM manipulation
                    // we need to execute their event handlers asynchronously using $evalAsync,
                    // so that they are not executed in an inconsistent state.
                    var forceAsyncEvents = {
                        'blur': true,
                        'focus': true
                    };

                    var isSubstituteWithValueBeenWatched = false;

                    ngModelCtrl.$viewChangeListeners.push(function () {
                        if (scope.isACPOIEnabled && isModelBeenWatched) {
                            evaluateCurrentState(ngModelCtrl.$modelValue, autocompleteContainer);
                        }
                    });

                    scope.$watch('substituteWithValue', function (newSubstituteWithValue, oldSubstituteWithValue) {

                        if (scope.isACPOIEnabled && isSubstituteWithValueBeenWatched) {
                            if (oldSubstituteWithValue == newSubstituteWithValue) {
                                return;
                            }
                            if (autocompleteContainer.autocompletableValue === false) {
                                return;
                            }
                            selectItemNewValue(newSubstituteWithValue);
                        }
                    });

                    function itemInputFocus() {

                        evaluateCurrentState(scope.model, autocompleteContainer);

                        enableModelWatcher();
                        enableSubstituteWithValueWatcher();
                    }

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

                    function selectItemNewValue(innerSubstituteValue) {
                        var newValue = getFullySubstitutedValue(innerSubstituteValue, autocompleteContainer);

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


                /**
                 * Config for Mustache autocomplete
                 *
                 * @returns {{start: string, startRegexEscaped: string, end: string, endRegexEscaped: string}}
                 */
                function getDefaultAutocompleteObj() {
                    return {
                        start: "{{",
                        startRegexEscaped: "\\{\\{",
                        end: "}}",
                        endRegexEscaped: "\\}\\}"
                    }
                }

            }
        };
    };
});
