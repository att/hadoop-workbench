define(function (require, exports, module) {
    "use strict";

    var angular = require('angular');
    var TranscludePlaceholderController = require('./transclude-placeholder')['TranscludePlaceholderController'];
    var defaultStubTemplate = '<div>Loading...</div>';

    var components = {};
    var toCamelCase = function (str) {
        return str.split(/-/).reduce(function (str, strPart, index) {
            if (!index) {
                return str += strPart;
            }
            str += strPart.charAt(0).toUpperCase() + strPart.substr(1);
            return str;
        }, '');
    };

    var fromCamelCase = function (str) {
        return str.split(/([A-Z])/).reduce(function (str, strPart, index) {
            if (!index) {
                return str + strPart;
            }
            if (strPart.toUpperCase() === strPart) {
                return str + '-' + strPart.toLowerCase();
            }
            return str + strPart;
        }, '');
    };

    function extendModule(extendedModule) {
        // Alternatively, shortcut to accessing the componentProvider via extendedModule.component
        extendedModule.component = function (name, options) {
            options = angular.extend({
                template: null,
                pathPrefix: '',
                controller: angular.noop,
                controllerAs: null,
                restrict: 'E',
                transclude: false,
                scope: {},
                stubTemplate: defaultStubTemplate,
                stubTemplateUrl: undefined,
                componentTransclusion: false
            }, options);
            if (!options.templateUrl) {
                options.templateUrl = options.pathPrefix + 'components/' + name + '/index.html';
            }
            var template = options.template;
            var templateUrl = options.templateUrl;
            var controller = options.controller;
            var controllerAs = options.controllerAs;
            var restrict = options.restrict;
            var transclude = options.transclude;
            var scope = options.scope;
            var stubTemplate = options.stubTemplate;
            var stubTemplateUrl = options.stubTemplateUrl;
            var componentTransclusion = options.componentTransclusion;

            var directiveName = toCamelCase(name);

            components[name] = {
                name: name,
                stubTemplate: stubTemplate,
                stubTemplateUrl: stubTemplateUrl,
                template: template,
                templateUrl: templateUrl,
                controller: controller,
                controllerAs: controllerAs,
                restrict: restrict,
                transclude: transclude,
                scope: scope,
                componentTransclusion: componentTransclusion
            };

            if (!name) {
                throw new Error('You can not register a component without a name!');
            }

            if (componentTransclusion) {
                extendedModule.directive(directiveName, function () {
                    return {
                        transclude: true,
                        controller: TranscludePlaceholderController,
                        compile: function (scope, tElement) {
                            return function (scope, element, attrs, ctrl) {
                                element.data('get-transclude-placeholder-base-Ctrl', function () {
                                    return ctrl;
                                });
                                ctrl.transcluded();
                            };
                        }
                    };
                });
            }

            extendedModule.directive(directiveName, function ($http, $q, $compile, $controller, $injector) {
                var stubTemplateKind = stubTemplateUrl ? 'templateUrl' : 'template';
                var stub = stubTemplateUrl || stubTemplate;
                var directive = {
                    restrict: restrict,
                    scope: scope,
                    transclude: transclude,
                    compile: function (tElement, tAttrs) {
                        var templateCache = $injector.get('$templateCache');

                        return function ($scope, $element, $attrs, ctrl, $transclude) {
                            $element.addClass(name);

                            if (template) {
                                render(template);
                            } else {
                                $http.get(templateUrl, {
                                    cache: templateCache
                                }).then(function (response) {
                                    render(response.data);
                                }, function (error) {
                                    console.error('Template for component "' + name + '" not found by URL ' + templateUrl);
                                });
                            }

                            function render(templateHtml) {
                                var componentParams = Object.keys(scope).reduce(function (store, key) {
                                    store[key] = $scope[key];
                                    return store;
                                }, {});

                                $element.html(templateHtml);
                                var link = $compile($element.contents());
                                var controllerInstance = $controller(controller, {
                                    $scope: $scope,
                                    params: componentParams
                                });
                                if (controllerAs) {
                                    $scope[controllerAs] = controllerInstance;
                                }
                                $element.data('$ngControllerController', controllerInstance);
                                $element.children().data('$ngControllerController', controllerInstance);

                                if (controllerInstance && typeof controllerInstance.onComponentWillMounted === 'function') {
                                    controllerInstance.onComponentWillMounted();
                                }

                                link($scope);

                                if (controllerInstance && typeof controllerInstance.onComponentDidMounted === 'function') {
                                    controllerInstance.onComponentDidMounted();
                                }

                                var unwatchers = Object.keys(scope).map(function (key) {
                                    var val = scope[key];
                                    var attrType = val.charAt(0);
                                    switch (attrType) {
                                        case '=':
                                        case '&':
                                            return $scope.$watch(key, function (newValue, oldValue) {
                                                if (angular.equals(newValue, oldValue)) {
                                                    return;
                                                }
                                                if (controllerInstance && typeof controllerInstance.onParamChanged === 'function') {
                                                    controllerInstance.onParamChanged(key, newValue, oldValue);
                                                }
                                            });
                                        case '@':
                                            return $attrs.$observe(key, function (newValue, oldValue) {
                                                if (angular.equals(newValue, oldValue)) {
                                                    return;
                                                }
                                                if (controllerInstance && typeof controllerInstance.onParamChanged === 'function') {
                                                    controllerInstance.onParamChanged(key, newValue, oldValue);
                                                }
                                            });
                                        default:
                                            return angular.noop;
                                    }
                                });
                            }
                        };
                    }
                };
                directive[stubTemplateKind] = stub;
                return directive;
            });

            return extendedModule;
        };

        return extendedModule;
    }

    exports['extendModule'] = extendModule;
    exports['components'] = components;
    exports['fromCamelCase'] = fromCamelCase;
    exports['toCamelCase'] = toCamelCase;
    exports['components'] = components;
});
