define(function (require) {
    "use strict";
    var angular = require('angular');
    require('../ngModule').directive('inputAutocomplete', ['$compile', '$parse', '$timeout', function ($compile, $parse, $timeout) {
        return {
            restrict: 'A',
            scope: false,

            link: function (scope, element, attrs, ctrl) {

                scope.onChooseCb = $parse(attrs.inputAutocompleteFloatingOnChoose)(scope);
                scope.isEnabled = $parse(attrs.inputAutocompleteFloatingEnabled)(scope);
                scope.data = $parse(attrs.inputAutocompleteFloatingData)(scope);
                scope.model = attrs.inputAutocompleteFloatingModel;
                scope.skipListGeneration = $parse(attrs.inputAutocompleteSkipListGeneration)(scope);

                var wrapperId = 'autocomplete-random-' + ('' + Math.random()).slice(2);

                var selectedIndex = -1;
                var isCompiled = false;
                var appendedElement = null;
                scope.$watch(function () {
                    scope.isEnabled =  $parse(attrs.inputAutocompleteFloatingEnabled)(scope);
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

                        if (event.keyCode === keyCodeEnter) {
                            let model = $parse(scope.model)(scope);
                            if (selectedIndex > -1) {
                                var selectedModule = scope.data[selectedIndex];
                                if (selectedModule) {
                                    chooseElement(selectedModule);
                                }
                            } else if (model) {
                                chooseElement({key: model});
                            }

                            return false;
                        }
                        function setSelectedIndex(index) {
                            selectedIndex = index;

                            scope.$apply(function(){
                                scope.listSelectedIndex = index;
                            });

                        }

                        function chooseElement(item) {
                            scope.$apply(function(){
                                scope.onChooseCb.call(null, item);
                            });
                        }

                    } );

                scope.$on("$destroy", function () {
                    onDestroy();
                });


                function appendAndCompile() {
                    if (scope.skipListGeneration) {
                        return;
                    }

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
                    $timeout(function() {
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

            }
        };
    }]);
});
