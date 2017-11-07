define(function (require) {
    "use strict";

    var angular = require('angular');
    var $ = require("jquery");

    require("../ngModule").directive('contenteditable', contentEditable);

    contentEditable.$inject = ['$parse', '$sce', 'safeApply', '$timeout'];

    function contentEditable($parse, $sce, safeApply, $timeout) {
        return {
            require: '?ngModel',
            compile: function (element, attrs) {
                var callbackOnEditFinish = $parse(attrs.contenteditableCallback);
                var discardChangesOnEsc = $parse(attrs.contenteditableDiscardChangesOnEsc)();
                var executeCbOnEsc = $parse(attrs.contenteditableCallbackOnEsc);

                // trim spaces by default
                var trimSpaces = attrs.contenteditableTrimSpaces !== 'false';

                return function (scope, element, attrs, ngModel) {

                    if (!ngModel) {
                        return; // do nothing if no ng-model
                    }

                    // Specify how UI should be updated
                    ngModel.$render = function () {
                        element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
                    };

                    var eventsBounds = false;
                    var documentElem = angular.element(document);
                    var initialValue = null;

                    // Bound "exit" events when element is in edit mode
                    element.on('focus', function () {
                        if (!eventsBounds) {
                            eventsBounds = true;
                            initialValue = element.html();

                            // update values on model on each input
                            element.on('input.contenteditable', function () {
                                scope.$apply(read);
                            });

                            // exit edit mode when focus is changed
                            element.on('blur.contenteditable', function (e) {
                                exitEditMode(false, callbackOnEditFinish);
                            });

                            element.on('keydown.contenteditable', function (e) {
                                $timeout(function(){checkValueRestrictions(scope);}, 300);
                            });


                            // exit edit mode when clicked on ENTER
                            element.on('keypress.contenteditable', function (e) {
                                if (e.which === 13) {
                                    e.preventDefault();
                                    exitEditMode(true, callbackOnEditFinish);
                                }
                            });

                            // exit edit mode when clicked on ESC
                            documentElem.on('keyup.contenteditable', function (e) {
                                if (e.which === 27) {
                                    e.preventDefault();
                                    // check for null and undefined
                                    var initialValueIsSet = !angular.isUndefined(initialValue) && initialValue !== null;
                                    if (discardChangesOnEsc && initialValueIsSet) {
                                        // update model with initial value
                                        scope.$apply(function () {
                                            ngModel.$setViewValue(initialValue);
                                        });
                                        // update control with initial value
                                        element.html(initialValue);
                                    }
                                    exitEditMode(true, executeCbOnEsc);
                                }
                            });
                        }
                    });

                    element.on('paste', function (event) {
                        event.preventDefault();
                        var clipboardEvent = event.originalEvent;
                        var text = clipboardEvent.clipboardData.getData('text/plain');
                        window.document.execCommand('insertText', false, text);
                    });

                    function exitEditMode(triggerBlur, callback) {
                        checkValueRestrictions(scope);

                        //unbind events
                        element.off('.contenteditable');
                        documentElem.off('.contenteditable');
                        eventsBounds = false;
                        initialValue = null;

                        // execute callback
                        if (typeof callback === "function") {
                            scope.$applyAsync(function () {
                                callback(scope);
                            });
                        }

                        // remove focus from the element
                        if (triggerBlur) {
                            // workaround to remove focus from the contenteditable, simple .blur() won't work
                            // see https://gist.github.com/shimondoodkin/1081133
                            // `disabled` attribute on the input prevents a browser from scrolling to the bottom of the page
                            var editableFix = $('<input disabled style="width:1px;height:1px;border:none;margin:0;padding:0;" tabIndex="-1">').appendTo('html');
                            editableFix.focus();

                            // this line cancels css-style ":focus..." for the element
                            element.blur();

                            editableFix[0].setSelectionRange(0, 0);
                            editableFix.blur();
                            editableFix.remove();
                        }
                    }

                    function trim(value) {
                        return typeof value === "string" ? value.trim() : value;
                    }

                    // Write data to the model
                    function read() {
                        var html = element.text();
                        // When we clear the content editable the browser leaves a <br> behind
                        // If strip-br attribute is provided then we strip this out
                        if (attrs.stripBr && html === "<br>") {
                            html = '';
                        }
                        let value = trimSpaces ? trim(html) : html;
                        ngModel.$setViewValue(value);
                    }

                    function checkValueRestrictions (scope) {
                        // @TODO: refactor this dependency into some type of parameter
                        if (scope && scope.$parent && scope.$parent.instance) {
                            scope.$parent.error = scope.$parent.instance.isRestrictedValue();
                        }
                    }
                };
            }
        };
    }
});
