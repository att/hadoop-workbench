define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').service('dashboard.WidgetsManager', GetDashboardWidgetsManager);

    GetDashboardWidgetsManager.$inject = [
        'dashboard.models.Widget',
        'dashboard.WidgetManager',
        'core.focusCatcherService',
    ];

    function GetDashboardWidgetsManager(Widget, widgetManager, focusCatcherService) {
        this.widgets = [];
        var widgets = this.widgets;

        this.removeWidget = function (dashboardWidget) {
            var widgetIndexInCollection = -1;
            widgets.forEach(function (w, i) {
                if (dashboardWidget === w.dashboardWidget) {
                    widgetIndexInCollection = i;
                }
            });
            if (widgetIndexInCollection > -1) {
                widgets.splice(widgetIndexInCollection, 1);
            }
        };

        this.removeAllWidgets = function () {
            widgets.splice(0, widgets.length);
        };

        this.addWidget = function (data, position, notCachedData) {
            if (ng.isObject(data)) {
                var widgetDescription = widgetManager.widget(data.widgetName);
                if (!widgetDescription) {
                    throw new Error('Widget description for "' + data.widgetName + '" not found. Check if name is correct or its widget description is loaded.');
                }

                var widgetOptions = ng.extend(widgetDescription, data, notCachedData);
                var w = Widget.factory(widgetOptions);
                var container = {
                    dashboardWidget: w
                };

                //TODO: need to investigate of using function 'setWidgetPosition' when user adds new widget
                //this.widgets.push(container);
                //setWidgetPosition.apply(this, [container, position]);

                switch (true) {
                    case !ng.isUndefined(position.replace):
                    {
                        this.widgets.some(function (w, index) {
                            if (w.dashboardWidget === position.replace) {
                                widgets.splice(index, 1, container);
                                return true;
                            }
                        });
                        break;
                    }
                    case !ng.isUndefined(position.before):
                    {
                        this.widgets.some(function (w, index) {
                            if (w.dashboardWidget === position.before) {
                                widgets.splice(index, 0, container);
                                return true;
                            }
                        });
                        break;
                    }
                    case !ng.isUndefined(position.after):
                    {
                        var positionIndex = -1;
                        this.widgets.some(function (w, index, array) {
                            if (w.dashboardWidget === position.after) {
                                positionIndex = index;
                                return true;
                            }
                        });
                        if (positionIndex !== -1) {
                            var isLastWidget = positionIndex + 1 >= widgets.length;
                            if (isLastWidget) {
                                this.widgets.push(container);
                            } else {
                                widgets.splice(positionIndex + 1, 0, container);
                            }
                        }
                        break;
                    }
                    case !ng.isUndefined(position.top):
                    {
                        this.widgets.unshift(container);
                        break;
                    }
                    default :
                    {
                        this.widgets.push(container);
                        break;
                    }
                }
                /**
                 * Focus newly created widget (but skip restored widgets from been focused)
                 */
                if (!notCachedData || !notCachedData.isRestored) {
                    this.changeActiveWidget(container.dashboardWidget);
                }
            }
        };

        this.getWidgetByGUID = function (guid) {
            var container = this.widgets.filter(function (w) {
                    return w.dashboardWidget.guid === guid;
                })[0] || null;
            return container ? container.dashboardWidget : null;
        };

        this.changeActiveWidget = function (dashboardWidget, position, widgetOptions) {
            var self = this;
            widgets.forEach(function (w, i) {
                if (dashboardWidget === w.dashboardWidget) {
                    var hotkeyBindings = getWidgetHotkeyBindings(dashboardWidget);
                    if (hotkeyBindings) {
                        /**
                         * @NOTICE: "changeActiveWidget" action called in directive 'focus-catcher'
                         * on event 'focus-catcher.bubbled-click'
                         *
                         * @TODO refactor this double call?
                         */

                        focusCatcherService.register(hotkeyBindings, true);
                    } else {
                        focusCatcherService.delayedRegister(function () {
                            return getWidgetHotkeyBindings(dashboardWidget);
                        });
                    }

                    if (widgetOptions) {
                        getWidgetApplyOptionsCallback(dashboardWidget)(widgetOptions);
                    }
                    w.dashboardWidget.isActive = true;
                    if (!ng.isUndefined(position)) {
                        setWidgetPosition.apply(self, [w, position]);
                    }

                } else {
                    w.dashboardWidget.isActive = false;
                }
            });

            function getWidgetHotkeyBindings(dashboardWidget) {
                var storeExports = dashboardWidget.__fluxStore__exports;
                return storeExports && storeExports.getHotkeyBindings? storeExports.getHotkeyBindings(): null;
            }

            /**
             * Get widget callback to do some widget action
             * @param dashboardWidget
             * @returns {Function}
             */
            function getWidgetApplyOptionsCallback(dashboardWidget) {
                var storeExports = dashboardWidget.__fluxStore__exports;

                if (storeExports &&
                    storeExports.getExternalActions &&
                    typeof storeExports.getExternalActions() === "function") {

                    return function (widgetOptions) {
                        storeExports.getExternalActions()('applyOptionsCallback', widgetOptions && widgetOptions.params);
                    }

                }
                return function () {
                };
            }

        };

        this.changeWidgetPosition = function(dashboardWidget, position) {
            if (ng.isObject(dashboardWidget)) {
                setWidgetPosition.apply(this, [dashboardWidget, position]);
            }
        };

        function setWidgetPosition (widget, position) {
            var targetIndex = -1, currentIndex =  -1;

            if (ng.isUndefined(widget.dashboardWidget)) {
                widget = {dashboardWidget: widget};
            }

            this.widgets.some(function (w, index) {
                if (w.dashboardWidget === widget.dashboardWidget) {
                    currentIndex = index;
                }
            });


            switch (true) {
                case !ng.isUndefined(position.before):
                {
                    this.widgets.some(function (w, index) {
                        if (w.dashboardWidget === position.before) {
                            targetIndex = index;
                            return true;
                        }
                    });
                    break;
                }
                case !ng.isUndefined(position.after):
                {
                    var positionIndex = -1;
                    this.widgets.some(function (w, index, array) {
                        if (w.dashboardWidget === position.after) {
                            positionIndex = index;
                            return true;
                        }
                    });
                    if (positionIndex !== -1) {
                        var isLastWidget = positionIndex + 1 >= this.widgets.length;
                        if (isLastWidget) {
                            targetIndex = this.widgets.length;
                        } else {
                            targetIndex = positionIndex + 1;
                        }
                    }
                    break;
                }
                case !ng.isUndefined(position.top):
                {
                    targetIndex = 0;
                    break;
                }
                default :
                {
                    targetIndex = this.widgets.length;
                    break;
                }
            }

            if (currentIndex !== targetIndex) {
                if (currentIndex === -1) {
                    this.widgets.unshift(widget);
                } else {
                    this.widgets.splice(targetIndex, 0, this.widgets.splice(currentIndex, 1)[0]);
                }
            }

        }
    }
});
