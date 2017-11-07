define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('dashboard-isolated-widget-accessor.WidgetActionsFactory', getFactory);

    getFactory.$inject = [
        'flux',
        'dashboard-isolated-widget-accessor.actions',
        'dashboard.WidgetsActions',
        'widgetConfig'
    ];
    function getFactory(flux, actions, DashboardWidgetsActions, widgetConfig) {
        return function factory(widgetGuid) {
            var widget;
            return {
                getWidget: function () {
                    widget = DashboardWidgetsActions.getWidgetByGUID(widgetGuid);
                    flux.dispatch(actions.SET_WIDGET + widgetGuid, widget);
                },
                close: function () {
                    DashboardWidgetsActions.removeWidget(widget);
                    flux.dispatch(actions.CLOSE + widgetGuid, widget);
                },
                onWidgetLoadSuccess: function () {
                    flux.dispatch(actions.SET_ERROR_MSG + widgetGuid, '');
                },
                onWidgetLoadError: function (error) {
                    flux.dispatch(actions.SET_ERROR_MSG + widgetGuid, extractErrorMessage(error));
                },
                setFullWidgetWidth: function (val) {
                    widget.fullWidth = val;
                    DashboardWidgetsActions.applyWidgetSizeChanges(widget);
                    flux.dispatch(actions.SIZE_CHANGED + widgetGuid);
                },
                increaseWidgetWidth: function () {
                    widget.wSize += 1;
                    DashboardWidgetsActions.applyWidgetSizeChanges(widget);
                    flux.dispatch(actions.SIZE_CHANGED + widgetGuid);
                },
                decreaseWidgetWidth: function () {
                    widget.wSize -= 1;
                    if (widget.wSize < 0) {
                        widget.wSize = 0;
                    }
                    DashboardWidgetsActions.applyWidgetSizeChanges(widget);
                    flux.dispatch(actions.SIZE_CHANGED + widgetGuid);
                },
                increaseWidgetHeight: function () {
                    widget.hSize += 1;
                    DashboardWidgetsActions.applyWidgetSizeChanges(widget);
                    flux.dispatch(actions.SIZE_CHANGED + widgetGuid);
                },
                decreaseWidgetHeight: function () {
                    widget.hSize -= 1;
                    if (widget.hSize < 0) {
                        widget.hSize = 0;
                    }
                    DashboardWidgetsActions.applyWidgetSizeChanges(widget);
                    flux.dispatch(actions.SIZE_CHANGED + widgetGuid);
                },
                historyBack: function () {
                    //TODO: implement it
                },
                updateWidgetStatusBarMessage: function (message) {
                    flux.dispatch(actions.SET_STATUS_BAR_MSG + widgetGuid, message);
                },
                updateWidgetProgressBarMessage: function (message) {
                    flux.dispatch(actions.SET_PROGRESS_BAR_MSG + widgetGuid, message);
                },
                updateWidgetStatusBarTabs: function (tabs) {
                    flux.dispatch(actions.SET_STATUS_BAR_TABS + widgetGuid, tabs);
                },
                updateWidgetHotkeyBindings: function (hotkeyBindings) {
                    flux.dispatch(actions.SET_HOTKEY_BINDINGS + widgetGuid, hotkeyBindings);
                },
                updateWidgetExternalActions: function (externalActions) {
                    flux.dispatch(actions.SET_EXTERNAL_ACTIONS + widgetGuid, externalActions);
                }
            }
        };

        function extractErrorMessage(error) {
            if (!error) {
                return 'Oops... Widget failed with unknown reason';
            }
            if (ng.isString(error)) {
                return error;
            }
            if (ng.isObject(error)) {
                if (ng.isString(error.message)) {
                    return error.message;
                }
                if (ng.isObject(error.data) && ng.isString(error.data.message)) {
                    return (error.statusText ? error.statusText + ': ' : '') + error.data.message;
                }
            }
            return 'Oops... Widget failed with unknown reason';
        }
    }
});
