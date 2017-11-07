define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').directive('dapWidget', dapWidget);
    require('../ngModule').directive('dapWidget', dapWidgetFill);

    dapWidget.$inject = ['$injector'];
    function dapWidget($injector) {
        function getService() {
            return ($injector.has) ? function (service) {
                return $injector.has(service) ? $injector.get(service) : null;
            } : function (service) {
                try {
                    return $injector.get(service);
                } catch (e) {
                    return null;
                }
            };
        }

        var service = getService(),
            $animator = service('$animator'),
            $animate = service('$animate');

        function getRenderer(attrs, scope) {
            var statics = function () {
                return {
                    enter: function (element, target, cb) {
                        target.after(element);
                        cb();
                    },
                    leave: function (element, cb) {
                        element.remove();
                        cb();
                    }
                };
            };

            if ($animate) {
                return {
                    enter: function (element, target, cb) {
                        var promise = $animate.enter(element, null, target, cb);
                        if (promise && promise.then) {
                            promise.then(cb);
                        }
                    },
                    leave: function (element, cb) {
                        var promise = $animate.leave(element, cb);
                        if (promise && promise.then) {
                            promise.then(cb);
                        }
                    }
                };
            }

            if ($animator) {
                var animate = $animator && $animator(scope, attrs);

                return {
                    enter: function (element, target, cb) {
                        animate.enter(element, null, target);
                        cb();
                    },
                    leave: function (element, cb) {
                        animate.leave(element);
                        cb();
                    }
                };
            }

            return statics();
        }

        return {
            restrict: 'ECA',
            terminal: true,
            priority: 400,
            transclude: 'element',
            compile: function (tElement, tAttrs, $transclude) {
                return function (scope, $element, attrs) {
                    var previousEl, currentEl, currentScope,
                        onloadExp = attrs.onload || '',
                        renderer = getRenderer(attrs, scope);
                    var initialized = false;

                    scope.$on('$dapWidgetReload', function (event, element) {
                        if (currentEl && currentEl[0] === element[0]) {
                            event.stopPropagation();
                            scope.$evalAsync(function () {
                                updateView(false);
                            });
                        }
                    });

                    scope.$on('$destroy', function () {
                        if (currentScope) {
                            currentScope.$destroy();
                        }
                    });

                    updateView(true);

                    function cleanupLastView() {
                        if (previousEl) {
                            previousEl.remove();
                            previousEl = null;
                        }

                        if (currentScope) {
                            currentScope.$destroy();
                            currentScope = null;
                        }

                        if (currentEl) {
                            renderer.leave(currentEl, function () {
                                previousEl = null;
                            });

                            previousEl = currentEl;
                            currentEl = null;
                        }
                    }

                    function updateView(firstTime) {
                        if (firstTime) {
                            initialized = true;
                        }

                        var newScope;

                        newScope = scope.$new();

                        //$element.html('');
                        var clone = $transclude(newScope, function (clone) {
                            renderer.enter(clone, $element, function onEnter() {
                                if (currentScope) {
                                    currentScope.$emit('$dapWidgetContentAnimationEnded', currentEl);
                                }
                            });
                            cleanupLastView();
                        });

                        currentEl = clone;
                        currentScope = newScope;
                        currentScope.$emit('$dapWidgetContentLoaded', currentEl);
                        currentScope.$eval(onloadExp);
                    }
                };
            }
        };
    }

    dapWidgetFill.$inject = ['dap-widget.$widget', '$compile', '$controller', '$q', '$parse'];
    function dapWidgetFill($widget, $compile, $controller, $q, $parse) {
        return {
            restrict: 'ECA',
            priority: -400,
            scope: {
                name: '=',
                onError: '=',
                onSuccess: '=',
                reload: '=?'
            },
            require: ['?^dashboardWidget'],
            compile: function (tElement, tAttrs, $transclude) {
                return function (scope, $element, attrs, requiredControllers) {
                    var initial = '';
                    var widgetPlugin;

                    // double part reference is used here - scope.$parent.$parent- because
                    // dapWidgetFill function creates one additional child scope
                    var parsedParamsExpression = $parse(attrs['params']);
                    scope.params = parsedParamsExpression(scope.$parent.$parent);
                    var originWidgetParams = scope.params;
                    var $widgetParams = originWidgetParams || {};
                    var onErrorFn = scope.onError || ng.noop;
                    var onSuccess = scope.onSuccess || ng.noop;

                    var name = scope.name;
                    var hostWidget = getHostWidget($element);

                    //TODO:// remove backward compatibility after configs' refactoring is completed
                    widgetPlugin = $widget.widget(name);

                    scope.$watch('reload', function (newValue, oldValue) {
                        if (newValue === oldValue) {
                            return;
                        }
                        scope.$emit("$dapWidgetReload", $element);
                    });

                    scope.$watch('name', function (newName) {
                        if (newName === name) {
                            return;
                        }
                        originWidgetParams = scope.params;
                        scope.$emit("$dapWidgetReload", $element);
                    });

                    var $$shared = hostWidget ? ng.extend({}, hostWidget.$$shared) : {};
                    var widgetLocals = ng.extend({}, hostWidget ? hostWidget.locals : null, {
                        $widgetParams: $widgetParams,
                        $$shared: $$shared
                    });

                    $q.when($widget.resolve(widgetPlugin, widgetLocals)).then(function (result) {
                        var locals = result.$$view;
                        var cleanedUpLocals = ng.extend({}, locals);
                        delete cleanedUpLocals.$$controller;
                        delete cleanedUpLocals.$$controllerAs;
                        delete cleanedUpLocals.$$widget;
                        delete cleanedUpLocals.$template;
                        $element.data('$dapWidget', {
                            name: name,
                            widget: {
                                locals: cleanedUpLocals,
                                $$shared: locals.$$shared
                            }
                        });
                        $element.html(locals.$template ? locals.$template : initial);

                        var link = $compile($element.contents());

                        if (locals.$$controller) {
                            locals.$scope = scope;
                            var controller = $controller(locals.$$controller, locals);
                            if (locals.$$controllerAs) {
                                scope[locals.$$controllerAs] = controller;
                            }
                            $element.data('$ngControllerController', controller);
                            $element.children().data('$ngControllerController', controller);

                            if (widgetPlugin.scope) {
                                scope.$watch(function () {
                                    return parsedParamsExpression(scope.$parent.$parent);
                                }, function (params) {
                                    scope.params = params;
                                }, true);

                                var unwatchers = Object.keys(widgetPlugin.scope).map(function (key) {
                                    var val = widgetPlugin.scope[key];
                                    var attrType = val.charAt(0);
                                    var delimiter = key ? '.' : '';
                                    switch (attrType) {
                                        case '=':
                                        case '&':
                                            return scope.$watch('params' + delimiter + key, function (newValue, oldValue) {
                                                if (ng.equals(newValue, oldValue)) {
                                                    return;
                                                }
                                                if (controller && typeof controller.onParamChanged === 'function') {
                                                    controller.onParamChanged(key, newValue, oldValue);
                                                }
                                            });
                                        default:
                                            return ng.noop;
                                    }
                                });

                            }

                        }

                        link(scope);
                        onSuccess();
                        scope.$emit("$dapWidgetChangeSuccess", name);

                    }, function (error) {
                        scope.$emit("$dapWidgetChangeError", name, error);
                        onErrorFn(error);
                        console.error('Can not render widget because of error: ', error);
                    });
                };

                function getHostWidget(element) {
                    var inherited = element.inheritedData('$dapWidget');
                    return inherited ? inherited.widget : null;
                }

                function getInheritedWidget(name, element) {
                    if (name.charAt(0) === '@') {
                        name = name.substr(1);
                    }
                    var inherited = element.inheritedData('$dapWidget');
                    if (!inherited) {
                        throw Error("DapWidget marked as nested but there are no parent dap-widget above");
                    }
                    return inherited.widget.views[name];
                }
            }
        };
    }
});
