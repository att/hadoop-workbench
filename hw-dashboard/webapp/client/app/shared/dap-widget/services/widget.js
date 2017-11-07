define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').provider('dap-widget.$widget', $WidgetProvider);

    $WidgetProvider.$inject = [];
    function $WidgetProvider() {
        var widgets = {};

        this.widget = widgetFn;

        function widgetFn(name, options) {
            if (ng.isUndefined(name)) {
                throw Error('Name should be defined for widget');
            }

            if (ng.isUndefined(options)) {
                return widgets[name];
            }

            if (!ng.isObject(options) || options === null) {
                throw Error('Widget should be an object');
            }

            console.assert(ng.isUndefined(widgets[name]), 'Widget with such name "' + name + '" is already defined');

            options = ng.extend({
                name: name,
                resolve: {}
            }, options);

            registerWidget(name, options);

            return this;
        }

        function registerWidget(name, widget){
            widgets[name] = widget;
        }

        this.$get = $get;
        $get.$inject = ['$q', '$resolve', 'dap-widget.$view', '$injector'];
        function $get($q, $resolve, $view, $injector) {
            return {
                resolve: resolve,
                widget: widgetFn
            };

            function resolve(widget, widgetLocals) {
                var locals = {resolve: null, globals: {}};
                var resolved = $q.when(locals);
                var options = {};
                resolved = resolveWidget(widget, widgetLocals, resolved, locals, options);
                return resolved.then(function () {
                    return locals;
                }, function (error) {
                    return $q.reject(error);
                });
            }

            function resolveWidget(widget, locals, inherited, dst, options) {
                locals = locals || {};
                var $widgetParams = locals.$widgetParams || {};

                // Resolve 'global' dependencies for the state, i.e. those not specific to a view.
                // We're also including $stateParams in this; that way the parameters are restricted
                // to the set that should be visible to the state, and are independent of when we update
                // the global $state and $stateParams values.
                dst.resolve = $resolve.resolve(widget.resolve, locals, dst.resolve, widget);
                var promises = [dst.resolve.then(function (globals) {
                    dst.globals = globals;
                })];
                if (inherited) {
                    promises.push(inherited);
                }

                // Resolve template and dependencies for all views.
                var views = {"$$view": widget};
                ng.forEach(views, function (view, name) {
                    var injectables = {};
                    injectables.$template = [function () {
                        return $view.load(name, {
                                view: view,
                                locals: locals,
                                params: $widgetParams
                            }) || '';
                    }];

                    promises.push($resolve.resolve(injectables, locals, dst.resolve, widget).then(function (result) {
                        // References to the controller (only instantiated at link time)
                        if (ng.isFunction(view.controllerProvider) || ng.isArray(view.controllerProvider)) {
                            var injectLocals = ng.extend({}, injectables, locals);
                            result.$$controller = $injector.invoke(view.controllerProvider, null, injectLocals);
                        } else {
                            result.$$controller = view.controller;
                        }
                        // Provide access to the state itself for internal use
                        result.$$widget = widget;
                        result.$$controllerAs = view.controllerAs;
                        dst[name] = result;
                    }));
                });

                // Wait for all the promises and then return the activation object
                return $q.all(promises).then(function (values) {
                    return dst;
                });
            }
        }

    }
});
