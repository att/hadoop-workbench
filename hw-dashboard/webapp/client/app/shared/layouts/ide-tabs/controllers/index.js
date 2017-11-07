/*jshint maxcomplexity: 7*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    var $ = require("jquery");

    require('../ngModule').controller('layouts.IdeTabsController', IdeTabsController);

    IdeTabsController.$inject = [
        "$scope",
        "tabsActions",
        "sizes",
        "$rootScope",
        'dashboard-isolated-widget-accessor.WidgetStore',
        'dashboard-isolated-widget-accessor.WidgetActions'
    ];
    function IdeTabsController($scope, tabsActions, sizes, $rootScope, WidgetStore, WidgetActions) {
        WidgetActions.getWidget();
        var $dashboardWidget = WidgetStore.getWidget();

        ng.extend($scope, {
            visibleTabs: [],
            hiddenTabs: [],
            showHiddenTabs: false,
            tabPanelWidth: 0
        });

        ng.extend($scope, {
            closeRightTab: function (index) {
                var indexInTabs = externalReferenceTabs.indexOf($scope.visibleTabs[index]);
                console.assert(indexInTabs !== -1, "There is no matching tab in the original tabs array for the tab from visibleTabs array");
                tabsActions.closeRightTab(indexInTabs);
            },
            tabClicked: function (event, index) {
                var indexInTabs = externalReferenceTabs.indexOf($scope.visibleTabs[index]);
                console.assert(indexInTabs !== -1, "There is no matching tab in the original tabs array for the tab from visibleTabs array");
                tabsActions.tabClicked(event, indexInTabs);
            },
            setActive: function (index) {
                tabsActions.setActive(index);
            },
            toggleHiddenTabsListDropdownClicked: function (close) {
                $scope.showHiddenTabs = close ? false : !$scope.showHiddenTabs;
            },
            clickOutsidePluginActionsDropdown: function () {
                $scope.showHiddenTabs = false;
            }
        });

        // TODO(maximk): investigate if it's possible to join watchers
        $scope.$watch(function () {
            return $dashboardWidget.wSize;
        }, function (size) {
            $scope.$broadcast("dashboard-width-changed");
        });

        $scope.$watch(function () {
            return $dashboardWidget.hSize;
        }, function (size) {
            $scope.$broadcast("dashboard-width-changed");
        });

        $scope.$watch(function () {
            return $dashboardWidget.fullWidth;
        }, function (fullWidth) {
            $scope.$broadcast("dashboard-width-changed");
        });

        // TODO(maximk): replace $rootScope with service
        $rootScope.$watch("windowWidth", function (newValue) {
            $scope.$broadcast("dashboard-width-changed");
        });

        var localTabs = [];
        var externalReferenceTabs = null;
        var visibleTabsMaxCount = 0;

        $scope.$watch("tabPanelWidth", function (width) {
            if (typeof width === "number" && width > 0) {
                visibleTabsMaxCount = Math.floor((width - sizes.hiddenTabsControlWidth) / sizes.tabWidth);
                splitLocalTabs();
            }
        });

        $scope.$on("tabs-change", function (event, tabs) {
            externalReferenceTabs = tabs.new;
            detectChangesAndRearrange(tabs.new, tabs.old);
            $scope.$broadcast("dashboard-width-changed");
        });

        $scope.$on("active-tab-changed", function (event, tab) {
            showActiveTabIfHidden(tab);
        });

        function detectChangesAndRearrange(newTabs, oldTabs) {
            var changes = findAddedOrRemovedTabs(newTabs, oldTabs);
            console.assert(changes.addedItems.length === 0 || changes.removedItems.length === 0, "IDE tabs manager doesn't support simultaneous additions and removal of tabs");

            switch (true) {
                case (changes.addedItems.length > 0):
                {
                    localTabs.unshift(changes.addedItems[0]);
                    break;
                }
                case (changes.removedItems.length > 0):
                {
                    var item = changes.removedItems[0];
                    var removedItemIndex = localTabs.indexOf(item);
                    console.assert(removedItemIndex !== -1, "Removed tab is not found in the local tabs array");
                    localTabs.splice(removedItemIndex, 1);
                    break;
                }
                default :
                {
                    // probably this is the initial run
                    if (newTabs.length > 0) {
                        localTabs = newTabs;
                    }
                }
            }

            splitLocalTabs();
        }

        function findAddedOrRemovedTabs(newTabs, oldTabs) {
            var addedItems = $(newTabs).not(oldTabs).get();
            var removedItems = $(oldTabs).not(newTabs).get();

            return {
                addedItems: addedItems,
                removedItems: removedItems
            };
        }

        function splitLocalTabs() {
            if (visibleTabsMaxCount >= 0) {
                $scope.visibleTabs = localTabs.slice(0, visibleTabsMaxCount);
                var hiddenTabs = localTabs.slice(visibleTabsMaxCount);

                $scope.hiddenTabs.length = 0;
                hiddenTabs.forEach(function (tab) {
                    $scope.hiddenTabs.push({
                        tab: tab,
                        handler: function (tab) {
                            showTab(tab);
                            var indexInTabs = externalReferenceTabs.indexOf(tab);
                            console.assert(indexInTabs !== -1, "There is no matching tab in the original tabs array for the tab from visibleTabs array");
                            $scope.setActive(indexInTabs);
                            $scope.showHiddenTabs = false;
                        }
                    });
                });
            }
        }

        function showTab(tab) {
            var indexInLocalTabs = localTabs.indexOf(tab);
            console.assert(indexInLocalTabs !== -1, "There is no corresponding local tab for clicked hidden tab");
            // make the clicked tab first tab in local tabs
            localTabs.splice(0, 0, localTabs.splice(indexInLocalTabs, 1)[0]);
            // show this tab
            splitLocalTabs();
        }

        function showActiveTabIfHidden(activeTab) {
            var activeTabIsHidden = !!$scope.hiddenTabs.filter(function (container) {
                return container.tab === activeTab;
            })[0];

            if (activeTabIsHidden) {
                showTab(activeTab);
            }
        }
    }
});
