define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('layouts.DashboardWidgetController', Controller);

    Controller.$inject = [
        '$scope',
        'dashboard-isolated-widget-accessor.WidgetStore',
        'dashboard-isolated-widget-accessor.WidgetActions',
        'dashboard-isolated-widget-accessor.widget-store-events',
        '$timeout',
        '$rootScope'
    ];
    function Controller($scope, WidgetStore, WidgetActions, widgetStoreEvents, $timeout, $rootScope) {
        var widgetTabs = [];
        var unwatchWidgetTabsChange = null;
        var unwatchWidgetActiveTabChange = null;
        var leftTabsInitialized = false;

        WidgetActions.getWidget();

        ng.extend($scope, {
            widget: WidgetStore.getWidget(),
            errorMessage: WidgetStore.getErrorMessage(),
            statusBarText: WidgetStore.getStatusBarMessage(),
            statusBarTabsWidgetName: 'status-bar-tabs',
            widgetMinSize: WidgetStore.getWidgetMinSize(),
            widgetMaxSize: WidgetStore.getWidgetMaxSize(),
            widgetLeftTabs: [],
            leftTabClicked: function ($event, index) {
                var isMiddleButtonClicked = $event.which === 2 || $event.which === 4;
                if (isMiddleButtonClicked) {
                    var tab = $scope.widget.leftTabManager.getTab(index);
                    if (tab.closable) {
                        $scope.widget.leftTabManager.removeTab(index);
                    }
                } else {
                    $scope.widget.leftTabManager.setActive(index);
                }
            },
            ideTabsWidgetParams: {
                sizes: {
                    tabWidth: 150,
                    hiddenTabsControlWidth: 40
                },
                tabsActions: {
                    closeRightTab: function (index) {
                        var tab = $scope.widget.tabManager.getTab(index);
                        if (tab.closable) {
                            $scope.widget.tabManager.removeTab(index);
                        }
                    },
                    tabClicked: function tabClicked($event, index) {
                        var isMiddleButtonClicked = $event.which === 2 || $event.which === 4;
                        if (isMiddleButtonClicked) {
                            var tab = $scope.widget.tabManager.getTab(index);
                            if (tab.closable) {
                                $scope.widget.tabManager.removeTab(index);
                            }
                        } else {
                            $scope.widget.tabManager.setActive(index);
                        }
                    },
                    setActive: function (index) {
                        $scope.widget.tabManager.setActive(index);
                    }
                }
            },
            showPluginActions: false,
            pluginActions: WidgetStore.getWidget().pluginActions

        });
        $scope.widget.hotkeyBindings = WidgetStore.getHotkeyBindings();
        ng.extend($scope, {
            close: function (silent) {
                if (silent) {
                    WidgetActions.close();
                } else {
                    WidgetActions.close();
                }
            },
            setFullWidgetWidth: function () {
                WidgetActions.setFullWidgetWidth(!$scope.widget.fullWidth);
            },
            increaseWidgetWidth: function () {
                WidgetActions.increaseWidgetWidth();
            },
            decreaseWidgetWidth: function () {
                WidgetActions.decreaseWidgetWidth();
            },
            increaseWidgetHeight: function () {
                WidgetActions.increaseWidgetHeight();
            },
            decreaseWidgetHeight: function () {
                WidgetActions.decreaseWidgetHeight();
            },
            onWidgetError: function (...args) {
                WidgetActions.onWidgetLoadError(...args);
            },
            onWidgetSuccess: function (...args) {
                WidgetActions.onWidgetLoadSuccess(...args);
            },
            historyBack: function () {
                WidgetActions.historyBack();
            },
            clickOutsidePluginActionsDropdown: function () {
                $scope.showPluginActions = false;
            },
            togglePluginActionsDropdownClicked: function (close) {
                $scope.showPluginActions = close ? false : !$scope.showPluginActions;
            }
        });

        $scope.$listenTo(WidgetStore, 'change', function () {
            $scope.widget = WidgetStore.getWidget();
            $scope.errorMessage = WidgetStore.getErrorMessage();
            $scope.statusBarText = WidgetStore.getStatusBarMessage();
            $scope.widget.hotkeyBindings = WidgetStore.getHotkeyBindings();
            $scope.widgetMinSize = WidgetStore.getWidgetMinSize();
            $scope.widgetMaxSize = WidgetStore.getWidgetMaxSize();

            if (unwatchWidgetTabsChange) {
                unwatchWidgetTabsChange();
            }
            unwatchWidgetTabsChange = $scope.widget.tabManager.on('tabs-change', function (event, tabs) {
                $scope.$broadcast("tabs-change", {old: widgetTabs, new: tabs});
                widgetTabs = ng.extend([], tabs);
                if (!$rootScope.$$phase) {
                    $rootScope.$digest();
                }
            });

            if (unwatchWidgetActiveTabChange) {
                unwatchWidgetActiveTabChange();
            }

            unwatchWidgetActiveTabChange = $scope.widget.tabManager.on('active-tab-changed', function (event, tab) {
                $scope.$broadcast("active-tab-changed", tab);
                if (!$rootScope.$$phase) {
                    $rootScope.$digest();
                }
            });

            if (!leftTabsInitialized) {
                leftTabsInitialized = true;
                $scope.widget.leftTabManager.on('tabs-change', function (event, tabs) {
                    //$scope.$broadcast("left-tabs-changed", tabs);
                    $scope.widgetLeftTabs = tabs;
                    $timeout(function () {
                        $scope.$broadcast("dashboard-width-changed");
                    });
                });
            }

            $scope.$broadcast("dashboard-width-changed");
        });

        $scope.$listenTo(WidgetStore, widgetStoreEvents.SIZE_CHANGED, function () {
            $scope.widget = WidgetStore.getWidget();
            $scope.$broadcast("dashboard-width-changed");
        });

        $scope.$listenTo(WidgetStore, widgetStoreEvents.STATUS_BAR_CHANGED, function () {
            $scope.statusBarText = WidgetStore.getStatusBarMessage();
        });

        $scope.$listenTo(WidgetStore, widgetStoreEvents.HOTKEY_BINDINGS_CHANGED, function () {
            $scope.widget.hotkeyBindings = WidgetStore.getHotkeyBindings();
        });

        $scope.$listenTo(WidgetStore, widgetStoreEvents.PROGRESS_BAR_CHANGED, function () {
            $scope.progressBarText = WidgetStore.getProgressBarMessage();
        });

        $scope.$listenTo(WidgetStore, widgetStoreEvents.STATE_CHANGED, function () {
            $scope.statusBarText = WidgetStore.getStatusBarMessage();
            $scope.errorMessage = WidgetStore.getErrorMessage();
            $scope.$broadcast("dashboard-width-changed");
        });

        $scope.$watch('[widget.title, widget.secondaryTitle]', function (event) {
            $timeout(function () {
                $scope.$broadcast("dashboard-width-changed");
            });
        });


        $scope.$on('$destroy', function () {
            if (unwatchWidgetTabsChange) {
                unwatchWidgetTabsChange();
            }
        });
    }
});
