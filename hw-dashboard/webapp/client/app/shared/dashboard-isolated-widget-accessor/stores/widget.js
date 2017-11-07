define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule')
        .factory('dashboard-isolated-widget-accessor.WidgetStoreFactory', getStore);

    getStore.$inject = [
        'flux',
        'dashboard-isolated-widget-accessor.actions',
        'dashboard-isolated-widget-accessor.widget-store-events'
    ];
    function getStore(flux, actions, widgetStoreEvents) {

        return function factory(widgetGuid) {
            return flux.createStore(function (exports) {
                var self = this;
                this.widget = null;
                this.errorMessage = '';
                this.statusBarText = '';
                this.progressBarText = '';
                this.statusBarTabs = [];
                this.hotkeyBindings = undefined;
                this.externalActions = undefined;
                this.widgetMinSize = 5;
                this.widgetMaxSize = 10;

                this.updateWidget = function (widget) {
                    self.widget = widget;
                    self.widget.__fluxStore = self;
                    self.widget.__fluxStore__exports = exports;
                    self.emitChange();
                };

                this.updateErrorMessage = function (errorMsg) {
                    self.errorMessage = errorMsg;
                    self.emit(widgetStoreEvents.STATE_CHANGED);
                };

                this.updateStatusBar = function (message) {
                    self.statusBarText = message;
                    self.emit(widgetStoreEvents.STATUS_BAR_CHANGED);
                };

                this.updateProgressBar = function (message) {
                    self.progressBarText = message;
                    self.emit(widgetStoreEvents.PROGRESS_BAR_CHANGED);
                };

                this.updateStatusBarTabs = function (tabs) {
                    self.statusBarTabs = tabs;
                    self.emit(widgetStoreEvents.STATUS_BAR_TABS_CHANGED);
                };

                this.updateHotkeyBindings = function (hotkeyBindings) {
                    self.hotkeyBindings = hotkeyBindings;
                    self.emit(widgetStoreEvents.HOTKEY_BINDINGS_CHANGED);
                };

                this.updateExternalActions = function (externalActions) {
                    self.externalActions = externalActions;
                    self.emit(widgetStoreEvents.EXTERNAL_ACTIONS_CHANGED);
                };

                this.updateWidgetSize = function () {
                    self.emit(widgetStoreEvents.SIZE_CHANGED);
                };

                this.on(actions.SET_WIDGET + widgetGuid, this.updateWidget);
                this.on(actions.SET_ERROR_MSG + widgetGuid, this.updateErrorMessage);
                this.on(actions.SIZE_CHANGED + widgetGuid, this.updateWidgetSize);
                this.on(actions.SET_STATUS_BAR_MSG + widgetGuid, this.updateStatusBar);
                this.on(actions.SET_PROGRESS_BAR_MSG + widgetGuid, this.updateProgressBar);
                this.on(actions.SET_STATUS_BAR_TABS + widgetGuid, this.updateStatusBarTabs);
                this.on(actions.SET_HOTKEY_BINDINGS + widgetGuid, this.updateHotkeyBindings);
                this.on(actions.SET_EXTERNAL_ACTIONS + widgetGuid, this.updateExternalActions);

                exports.getWidget = function () {
                    return self.widget;
                };
                exports.getErrorMessage = function () {
                    return self.errorMessage;
                };
                exports.getStatusBarMessage = function () {
                    return self.statusBarText;
                };
                exports.getProgressBarMessage = function () {
                    return self.progressBarText;
                };
                exports.getStatusBarTabs = function () {
                    return self.statusBarTabs;
                };
                exports.getHotkeyBindings = function () {
                    return self.hotkeyBindings;
                };
                exports.getExternalActions = function () {
                    return self.externalActions;
                };
                exports.getWidgetMinSize = function () {
                    return self.widgetMinSize;
                };
                exports.getWidgetMaxSize = function () {
                    return self.widgetMaxSize;
                };
            });
        }
    }
});
