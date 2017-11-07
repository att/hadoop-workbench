define(function (require) {
    "use strict";

    require('../ngModule').factory('dashboard.WidgetsActions', getFactory);

    getFactory.$inject = [
        'flux',
        'dashboard.actions',
        'dashboard.WidgetsManager',
        '$rootScope',
        'userSettings.storage',
        'main.alerts.alertsManagerService'
    ];
    function getFactory(flux, actions, WidgetsManager, $rootScope, userSettingsStorage, dashboardAlertsManager) {
        var removeWidgetAlert;

        var widgetsActions = {
            fetchWidgets: function () {
                flux.dispatch(actions.FETCH_WIDGETS, WidgetsManager.widgets);
            },
            removeWidget: function (dashboardWidget, force) {
                var confirmRemoval = userSettingsStorage.get("confirmWidgetRemoval");
                if (force || !confirmRemoval) {
                    WidgetsManager.removeWidget(dashboardWidget);
                    flux.dispatch(actions.FETCH_WIDGETS, WidgetsManager.widgets);
                    return;
                }
                removeWidgetAlert = dashboardAlertsManager.addAlertInfo({
                    type: "confirm",
                    title: dashboardWidget.title,
                    text: "Are you sure you want to remove this widget?",
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                WidgetsManager.removeWidget(dashboardWidget);
                                flux.dispatch(actions.FETCH_WIDGETS, WidgetsManager.widgets);
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                            }
                        }
                    ]
                });
            },

            removeAllWidgets: function () {
                var confirmRemoval = userSettingsStorage.get("confirmWidgetRemoval");
                if (!confirmRemoval) {
                    WidgetsManager.removeAllWidgets();
                    flux.dispatch(actions.FETCH_WIDGETS, WidgetsManager.widgets);
                    return;
                }

                dashboardAlertsManager.addAlertInfo({
                    type: "confirm",
                    title: "Confirm",
                    text: "Are you sure you want to remove all widgets?",
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                WidgetsManager.removeAllWidgets();
                                flux.dispatch(actions.FETCH_WIDGETS, WidgetsManager.widgets);
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                close();
                            }
                        }
                    ]
                });
            },
            
            addWidget: function (dashboardWidgetData, position, notCachedData) {
                WidgetsManager.addWidget(dashboardWidgetData, position, notCachedData);
                flux.dispatch(actions.FETCH_WIDGETS, WidgetsManager.widgets);
            },
            applyWidgetSizeChanges: function () {
                if(!$rootScope.$$phase){
                    $rootScope.$digest();
                }
                flux.dispatch(actions.FETCH_WIDGETS, WidgetsManager.widgets);
            },
            getWidgetByGUID: function(widgetGuid){
                return WidgetsManager.getWidgetByGUID(widgetGuid);
            },
            changeActiveWidget: function (dashboardWidget, position) {
                WidgetsManager.changeActiveWidget(dashboardWidget, position);
                /**
                 * Event dispatch is not needed cause changes
                 * are distributed through object property change.
                 * And all consumers uses link to widget object
                 */
                 // flux.dispatch(actions.FETCH_WIDGETS, WidgetsManager.widgets);
            },
            /**
             * Add Widget with single instance
             *
             * @param {object} dashboardWidgetData
             * @param position
             * @param notCachedData
             * @param {String|Function} widgetNameOrWidgetCompareFunction widgetName {String}, or widgetCompare {Function}
             */
            addWidgetSingleton: function (dashboardWidgetData, position, notCachedData, widgetNameOrWidgetCompareFunction) {
                var compareFunction = function (widget) {
                    return false;
                };
                if (typeof widgetNameOrWidgetCompareFunction === "string") {
                    compareFunction = function (widget) {
                        return widget.dashboardWidget && widget.dashboardWidget.widgetName == "platform-manager"
                    };
                } else if (typeof widgetNameOrWidgetCompareFunction === "function") {
                    compareFunction = widgetNameOrWidgetCompareFunction;
                }
                var widgetsOpened = WidgetsManager.widgets || [];
                var openedPlatformWidget = widgetsOpened.filter(compareFunction);

                if (openedPlatformWidget.length) {
                    WidgetsManager.changeActiveWidget(openedPlatformWidget[0].dashboardWidget, position, dashboardWidgetData);
                } else {
                    WidgetsManager.addWidget(dashboardWidgetData, position, notCachedData);
                }
                flux.dispatch(actions.FETCH_WIDGETS, WidgetsManager.widgets);
            }
        };

        return widgetsActions;
    }
});
