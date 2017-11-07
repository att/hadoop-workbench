define(function (require) {
    'use strict';

    var ng = require('angular');
    var $ = require("jquery");

    require('../ngModule').controller('dashboard.indexController', IndexController);

    IndexController.$inject = [
        '$scope',
        'dashboard.WidgetManager',
        'dashboard.models.Widget',
        "dashboard.userDashboardStateService",
        "userDashboard",
        "$log",
        'dashboard.WidgetsStore',
        'dashboard.WidgetsActions',
        'widgets'
    ];

    function IndexController($scope, PluginManager, Widget, userDashboardService, userDashboard, $log, WidgetsStore, WidgetsActions, ngWidgetsService) {
        $scope.widgets = WidgetsStore.getWidgets();

        $scope.$listenTo(WidgetsStore, 'change', function () {
            $scope.widgets = WidgetsStore.getWidgets();
        });

        $scope.isCreateNewWidgetDropdownOpen = false;

        $scope.addNewWidget = addNewWidget;
        $scope.removeWidget = function (widget) {
            WidgetsActions.removeWidget(widget);
        };
        $scope.widgetSizeClass = widgetSizeClass;
        $scope.widgetHeight = widgetHeight;

        // keeping a copy of dashboard widgets as `savedWidgets` allows allows comparison with $scope.widgets
        // inside `widgetHasBeenChanged` handler to prevent redundant server requests if no changes are detected
        var savedWidgets = [];

        $scope.sortableConfig = {
            handle: '.b-dashboard-widget__header',
            cancel: '.not-draggable',
            stop: function () {
            }
        };
        $scope.resizeConfig = {
            grid: [136, 136],
            minWidth: 680,
            minHeight: 272
        };

        $scope.onWidgetResizeStart = function (widget) {
            var eventName = "widget-resize-start";
            $scope.$broadcast("widget-resize-start");
            ngWidgetsService.notifyWidget($scope.widgets.indexOf(widget), eventName);
        };

        $scope.onWidgetResizeStop = function (widget, options) {
            var eventName = "widget-resize-stop";
            var height = options.size.height;
            var width = options.size.width;
            var newWSize = Math.round(width / 136);
            var newHSize = Math.round(height / 136);
            widget.dashboardWidget.wSize = newWSize;
            widget.dashboardWidget.hSize = newHSize;
            $scope.$broadcast(eventName);
            ngWidgetsService.notifyWidget($scope.widgets.indexOf(widget), eventName);
        };

        $scope.$on('focus-catcher.bubbled-click', function(event, dashboardWidget) {
            WidgetsActions.changeActiveWidget(dashboardWidget);
        });

        $scope.changeActiveWidget = function (dashboardWidget) {
            WidgetsActions.changeActiveWidget(dashboardWidget);
        };

        restoreUserDashboard();

        $scope.$watchCollection("widgets", function (newWidgets, oldWidgets) {
            var dirty = false;
            var removedWidgets = $(oldWidgets).not(newWidgets).get();
            var addedWidgets = $(newWidgets).not(oldWidgets).get();
            var index = -1;

            if (removedWidgets.length > 0) {
                // savedWidgets are kept in sync with $scope.widgets, so indexes in savedWidgets and oldWidgets match
                removedWidgets.map(elem => oldWidgets.indexOf(elem))
                    .sort().reverse()
                    .forEach(index => savedWidgets.splice(index, 1));

                dirty = true;
            }

            if (addedWidgets.length > 0) {
                index = newWidgets.indexOf(addedWidgets[0]);
                savedWidgets.splice(index, 0, addedWidgets[0].dashboardWidget.toJSON());
                dirty = true;
            }

            var widgetsReordered = removedWidgets.length === 0 && addedWidgets.length === 0 && !ng.equals(newWidgets, oldWidgets);
            if (widgetsReordered) {
                saveReorderedWidgetsToLocalUserDashboard();
                dirty = true;
            }

            if (dirty) {
                persistLocalUserDashboardToServer();
            }
        });

        $scope.$on('widgetHasBeenChanged', function (event, dashboardWidget) {
            var index = getExistingWidgetIndex(dashboardWidget);
            console.assert(index !== -1, "Modified widget is not found in the list of existing widgets");
            var savedWidget = savedWidgets[index];
            if (!ng.equals(dashboardWidget.toJSON(), savedWidget)) {
                savedWidgets.splice(index, 1, dashboardWidget.toJSON());
                persistLocalUserDashboardToServer();
            }
            WidgetsActions.applyWidgetSizeChanges();
        });

        function persistLocalUserDashboardToServer() {
            var widgets2Save = [];
            savedWidgets.map(function (widget) {
                var pluginWidget = PluginManager.widget(widget.widgetName);
                if (pluginWidget && pluginWidget.type === 'browser') {
                    widgets2Save.push(widget);
                }
                if (pluginWidget && pluginWidget.type === 'service' && widget.params.source /*&& widget.params.source.isSaved*/) {
                    widgets2Save.push(widget);
                }
            });

            userDashboardService.saveUserDashboard(JSON.stringify({dashboard: {widgets: widgets2Save}}));
        }

        function saveReorderedWidgetsToLocalUserDashboard() {
            savedWidgets.length = 0;
            $scope.widgets.map(function (widgetContainer) {
                var widget = widgetContainer.dashboardWidget;
                savedWidgets.push(widget.toJSON());
            });
        }

        function getExistingWidgetIndex(dashboardWidget) {
            var index = -1;
            $scope.widgets.some(function (container, i) {
                if (dashboardWidget === container.dashboardWidget) {
                    index = i;
                    return true;
                }
            });
            return index;
        }

        function restoreUserDashboard() {
            var savedUserDashboard = null;
            try {
                savedUserDashboard = JSON.parse(userDashboard);
            }
            catch (e) {
                console.log("The value of user dashboard state isn't valid JSON");
            }
            if (savedUserDashboard) {
                $scope.widgets.splice(0);
                savedWidgets = savedUserDashboard.dashboard.widgets;
                savedWidgets.forEach(function (dashboardWidgetData) {
                    //Need try catch coz WidgetsManager.addWidget() can throw en exception
                    try {
                        WidgetsActions.addWidget(dashboardWidgetData, {}, { isRestored: true });
                    } catch (e) {
                        $log.error('Error occurred during adding saved widget to the dashboard.', e);
                    }
                });
                if ($scope.widgets.length && $scope.widgets[0] && $scope.widgets[0].dashboardWidget) {
                    WidgetsActions.changeActiveWidget($scope.widgets[0].dashboardWidget);
                }
            }
        }

        function addNewWidget(type, widgetName) {
            if (type === 'service' || type === 'browser') {
                var w = Widget.factory({
                    widgetName: widgetName,
                    params: {}
                });
                var container = {
                    dashboardWidget: w
                };
                $scope.widgets.unshift(container);
            }
        }

        function widgetSizeClass(widget) {
            if (widget.fullWidth) {
                return 'dashboard-col-max';
            }
            return 'dashboard-col-' + widget.wSize;
        }

        function widgetHeight(widget) {
            return widget.hSize * 120 + 16 * (widget.hSize - 1) + 16;
        }
    }
});
