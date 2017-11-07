define(function (require, exports, module) {
    "use strict";

    var angular = require('angular');
    var components = require('./component')['components'];
    var fromCamelCase = require('./component')['fromCamelCase'];

    angular.module('component-loader', [])
        .directive('componentLoader', ['$compile', '$parse', function ($compile, $parse) {
            return {
                restrict: 'EM',
                compile: function (tElement, tAttrs, $transclude) {
                    return function (scope, $element, $attrs) {
                        var $componentElement;
                        var lastProcessedName;
                        var copyAttrs = $parse($attrs.copyAttrs)(scope);
                        var excludeAttrs = ['name', 'params'];
                        var attributes;
                        if (copyAttrs !== false) {
                            if (Array.isArray(copyAttrs)) {
                                attributes = copyAttrs.reduce(function (host, attrName) {
                                    if ($attrs[attrName] !== undefined) {
                                        host[fromCamelCase(attrName)] = $attrs[attrName];
                                    }
                                    return host;
                                }, {});
                            } else {
                                attributes = Object.keys($attrs)
                                    .reduce(function (host, attrName) {
                                        if (typeof $attrs[attrName] === 'string' && excludeAttrs.indexOf(attrName) === -1) {
                                            host[fromCamelCase(attrName)] = $attrs[attrName];
                                        }
                                        return host;
                                    }, {});
                            }
                        }
                        var componentParams = $parse($attrs.params)(scope);

                        scope.$watch($attrs.name, function (newVal, oldVal) {
                            if (!newVal) {
                                return;
                            }
                            scope.$applyAsync(function () {
                                processComponent(newVal, oldVal);
                            })
                        });

                        function processComponent(componentName, oldComponentName) {
                            if (lastProcessedName === componentName) {
                                return;
                            }

                            lastProcessedName = componentName;

                            var componentDescriptor = components[componentName];
                            var attrs = Object.keys(componentDescriptor.scope)
                                .filter(function (key) {
                                    return componentParams[key];
                                })
                                .reduce(function (host, key) {
                                    host[fromCamelCase(key)] = componentParams[key];
                                    return host;
                                }, Object.assign({}, attributes));

                            $element.html('');
                            $componentElement = angular.element('<' + componentName + '/>').attr(attrs);
                            $element.append($componentElement);

                            if (!componentDescriptor) {
                                throw new Error('There is no component with name ' + componentName);
                            }

                            var link = $compile($componentElement);
                            link(scope);
                            $element = $componentElement;
                        }
                    };
                }
            };
        }]);

    exports['ngModuleName'] = angular.module('component-loader').name;
});
