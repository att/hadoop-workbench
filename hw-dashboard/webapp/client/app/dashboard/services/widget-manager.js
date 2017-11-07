define(function (require) {
    "use strict";

    var ng = require('angular');
    require("../ngModule").provider("dashboard.WidgetManager", PluginManagerProvider);

    var widgets = {};

    PluginManagerProvider.$inject = [];
    function PluginManagerProvider() {

        this.widget = widgetFn;
        this.$get = function () {
            return {
                getWidgets: getWidgets,
                widget: widgetFn
            };
        };

        function registerWidget(name, widget) {
            widgets[name] = widget;
        }

        function getWidgets(filters) {
            var filtered = [];
            for (var key in widgets) {
                if (widgets.hasOwnProperty(key)) {
                    var w = widgets[key];
                    if (filters) {
                        var addIt = true;
                        for (var sortKey in filters) {
                            if (filters.hasOwnProperty(sortKey)) {
                                addIt = w[sortKey] === filters[sortKey];
                                if (!addIt) {
                                    break;
                                }
                            }
                        }
                        if (addIt) {
                            filtered.push(w);
                        }
                    } else {
                        filtered.push(w);
                    }
                }
            }
            return filtered;
        }

        function widgetFn(widgetName, widgetDescription) {
            if (ng.isUndefined(widgetName)) {
                throw Error('Name should be defined for widget');
            }

            if (ng.isUndefined(widgetDescription)) {
                return widgets[widgetName];
            }

            if (!ng.isObject(widgetDescription) || widgetDescription === null) {
                throw Error('Widget should be an object');
            }

            //TODO(dimas): Made it to avoid console spamming with errors. Remove it when do refactoring (particularly - splitting plugins' modules by a module as it is and its shared part)
            if (widgets[widgetName]) {
                return this;
            }

            console.assert(ng.isUndefined(widgets[widgetName]), 'Widget with such name "' + widgetName + '" is already defined');

            widgetDescription = ng.extend({
                widgetName: widgetName,
                resolve: {},
                makeParams: function (data) {
                    return data;
                },
                injectModules: []
            }, widgetDescription);

            widgetDescription.isReady = true;
            widgetDescription.reload = function (cb) {
                this.isReady = false;
                setTimeout(function () {
                    this.isReady = true;
                    if (ng.isFunction(cb)) {
                        cb();
                    }
                }.bind(this), 0);
            }.bind(widgetDescription);

            registerWidget(widgetName, widgetDescription);

            return this;
        }
    }
});
