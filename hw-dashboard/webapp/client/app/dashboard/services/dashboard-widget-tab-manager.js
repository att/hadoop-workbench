define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory('dashboard.widgets.DashboardWidget.TabManager', getDashboardWidgetTabManager);

    getDashboardWidgetTabManager.$inject = ["dashboard.models.WidgetHeaderTab", "dashboard.DeferredResultEvent", "$q"];

    function getDashboardWidgetTabManager(WidgetHeaderTab, DeferredResultEvent, $q) {

        function DashboardWidgetTabManager() {
            this.eventListeners = [];
            this.currentIndex = -1;
            this.count = 0;
            this._tabs = [];
            this.activeTab = null;
        }

        DashboardWidgetTabManager.EVENTS = {
            TABS_CHANGED: "tabs-change",
            ACTIVE_PAGE_CHANGED: "active-page-change",
            ACTIVE_TAB_CHANGED: "active-tab-changed",
            BEFORE_TAB_REMOVE: "before-page-remove"
        };

        DashboardWidgetTabManager.factory = function () {
            return new DashboardWidgetTabManager();
        };

        DashboardWidgetTabManager.prototype = {

            addTab: function (page, label, tooltip, icon, isUnclosable, indicator) {
                var makeTabActive = this.count === 0;
                var tab = WidgetHeaderTab.factory({
                    page: page,
                    label: label,
                    tooltip: tooltip,
                    icon: icon,
                    closable: isUnclosable !== true,
                    indicator: indicator
                });
                this.count = this._tabs.push(tab);
                if (makeTabActive) {
                    this._setActive(0);
                }
                page.on('dirty', function (event, isDirty) {
                    tab.dirty = isDirty;
                });
                this.notifySubscribers(DashboardWidgetTabManager.EVENTS.TABS_CHANGED, this._tabs);
                var indexInTabsArray = this.count - 1;
                return indexInTabsArray;
            },

            getTabs: function () {
                return this._tabs;
            },

            getTab: function (index) {
                return this._tabs[index];
            },

            _getTabDirtySetter: function (index) {
                if (this._tabExists(index)) {
                    var tab = this._tabs[index];
                    return function (dirty) {
                        tab.dirty = dirty;
                    };
                }
            },

            _tabExists: function (index) {
                return typeof this._tabs[index] !== 'undefined';
            },

            removeTab: function (index) {
                var self = this;
                if (self._tabExists(index)) {
                    return $q(function (resolve, reject) {
                        var result = self.notifySubscribers(DashboardWidgetTabManager.EVENTS.BEFORE_TAB_REMOVE, self._tabs[index].page);
                        $q.all(result).then(function () {
                            var nextActiveTabIndex = self._findNextActiveTab(index);
                            self._tabs[index].page.beforeRemove();
                            self._tabs.splice(index, 1);
                            if (nextActiveTabIndex !== -1) {
                                self._setActive(nextActiveTabIndex);
                            } else {
                                self._setActive(-1);
                            }
                            self.notifySubscribers(DashboardWidgetTabManager.EVENTS.TABS_CHANGED, self._tabs);
                            self.count = self._tabs.length;
                            resolve(self.count);
                        }, function () {
                            reject(self.count);
                        });
                    });
                }
            },

            _findNextActiveTab: function (index) {
                var leftTabAvailable = !ng.isUndefined(this._tabs[index - 1]);
                var rightTabAvailable = !ng.isUndefined(this._tabs[index + 1]);

                if (leftTabAvailable) {
                    return index - 1;
                }

                if (rightTabAvailable) {
                    // return (index) here instead of (index + 1) because after element in index position is deleted
                    // (index + 1) becomes (index)
                    return index;
                }

                return -1;
            },

            clear: function () {
                this._tabs.splice(0, this._tabs.length);
                this.notifySubscribers(DashboardWidgetTabManager.EVENTS.TABS_CHANGED, this._tabs);
            },

            _setActive: function (index, fireEvent) {
                var self = this;
                this.currentIndex = index;
                this.activeTab = null;
                this._tabs.forEach(function (tab, tabIndex) {
                    if (index === tabIndex) {
                        self.activeTab = tab;
                    }
                    tab.active = index === tabIndex;
                    tab.page.setActive(tab.active);
                });

                var activePage = !ng.isUndefined(this._tabs[index]) ? this._tabs[index].page : null;
                if (fireEvent !== false) {
                    this.notifySubscribers(DashboardWidgetTabManager.EVENTS.ACTIVE_TAB_CHANGED, this._tabs[index]);
                    this.notifySubscribers(DashboardWidgetTabManager.EVENTS.ACTIVE_PAGE_CHANGED, activePage);
                }
            },

            getActive: function () {
                return this.currentIndex;
            },

            setIndicator: function (index, indicator) {
                this._tabs.forEach(function (tab, tabIndex) {
                    if (index === tabIndex) {
                        tab.indicator = indicator;
                    }
                })
            },

            setActive: function (index) {
                this._setActive(index);
            },

            setPageDirty: function (tab) {
                this.count = this._tabs.push(tab);
                return this.count - 1;
            },

            on: function (eventName, callback) {
                this.eventListeners.push({event: eventName, callback: callback});
                return this._getDeregistrationFn(callback);
            },

            _getDeregistrationFn: function (fn) {
                return function () {
                    var listenerIndex = -1;

                    this.eventListeners.forEach(function (listener, index) {
                        if (fn === listener.callback) {
                            listenerIndex = index;
                        }
                    });

                    if (listenerIndex !== -1) {
                        this.eventListeners.splice(listenerIndex, 1);
                    }
                }.bind(this);
            },

            notifySubscribers: function (eventName, params) {
                var event = DeferredResultEvent.factory();
                this.eventListeners.forEach(function (listener) {
                    if (listener.event === eventName) {
                        listener.callback(event, params);
                    }
                });
                var deferredResults = event.getDeferredResults();
                return deferredResults.length > 0 ? deferredResults : [$q.when()];
            },

            getIndexByPage: function (page) {
                for (var i = 0; i < this._tabs.length; i += 1) {
                    if (this._tabs[i].page === page) {
                        return i;
                    }
                }
                return -1;
            },

            getTabByField: function(fieldName, fieldValue) {
                for (var i = 0; i < this._tabs.length; i += 1) {
                    if (this._tabs[i][fieldName] === fieldValue) {
                        return i;
                    }
                }
                return -1;
            }
        };

        DashboardWidgetTabManager.prototype.constructor = DashboardWidgetTabManager;

        return DashboardWidgetTabManager;
    }

});
