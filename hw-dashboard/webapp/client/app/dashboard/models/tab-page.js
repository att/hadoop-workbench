define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("dashboard.models.TabPage", getTabPage);

    getTabPage.$inject = [
        "dashboard.DeferredResultEvent",
        "$q",
        "dashboard.widgets.DashboardWidget.TabManager",
        "dashboard.widgets.DashboardWidget.TabManager.EVENTS"
    ];
    function getTabPage(DeferredResultEvent, $q, TabManager, TabManagerEvents) {

        function TabPage(options) {
            this.name = options.name;
            this.params = options.params;
            this.isDirty = false;
            this.isActive = false;
            this._eventListeners = [];
            this.controls = [];
            this.leftTabManager = TabManager.factory();
            this.rightTabManager = TabManager.factory();
            this.leftTabs = this.leftTabManager.getTabs();
            this.rightTabs = this.rightTabManager.getTabs();

            this.reloadIndex = 0;

            this.leftTabManager.on(TabManagerEvents.TABS_CHANGED, function (event, tabs) {
                this.leftTabs = tabs;
            }.bind(this));

            this.rightTabManager.on(TabManagerEvents.TABS_CHANGED, function (event, tabs) {
                this.rightTabs = tabs;
            }.bind(this));

            this.onLoadSuccess = function () {
                this.notifySubscribers('pageLoadSuccess');
            }.bind(this);

            this.onLoadError = function (error) {
                this.notifySubscribers('pageLoadError', error);
            }.bind(this);
        }

        TabPage.EVENTS = {
            BEFORE_PAGE_REMOVE: "before-page-remove",
            ACTIVE_STATE_CHANGE: "active-state-change"
        };

        TabPage.prototype = {
            setDirty: function (dirty) {
                if (this.isDirty !== dirty) {
                    this.isDirty = dirty;
                    this.notifySubscribers('dirty', this.isDirty);
                }
            },
            setActive: function (active) {
                if (this.isActive !== active) {
                    this.isActive = active;
                    this.notifySubscribers(TabPage.EVENTS.ACTIVE_STATE_CHANGE, this.isActive);
                }
            },
            beforeRemove: function () {
                this.notifySubscribers(TabPage.EVENTS.BEFORE_PAGE_REMOVE);
            },
            getDirty: function () {
                return this.isDirty;
            },
            on: function (eventName, callback) {
                this._eventListeners.push({event: eventName, callback: callback});
            },
            notifySubscribers: function (eventName, params) {
                var event = DeferredResultEvent.factory();
                this._eventListeners.forEach(function (listener) {
                    if (listener.event === eventName) {
                        listener.callback(event, params);
                    }
                });

                var deferredResults = event.getDeferredResults();
                return deferredResults.length > 0 ? deferredResults : [$q.when()];
            },
            addControl: function (control) {
                this.controls.push(control);
            },
            findControlByName: function (controlName) {
                var index = -1;
                this.controls.map(function(elem, idx){
                    if (elem.name && elem.name == controlName) {
                        index = idx
                    }
                });
                return index;
            },
            setControls: function (controls) {
                this.controls.push.apply(this.controls, controls);
            },
            reload: function () {
                this.reloadIndex += 1;
                this.reset();
                return this;
            },
            reset: function () {
                this._eventListeners = [];
                this.controls = [];
                this.leftTabManager.clear();
                this.rightTabManager.clear();
                this.leftTabs = this.leftTabManager.getTabs();
                this.rightTabs = this.rightTabManager.getTabs();
            }
        };

        TabPage.factory = function (json) {
            json = ng.extend({
                name: "",
                params: {}
            }, json);

            return new TabPage(json);
        };

        TabPage.prototype.toJSON = function () {
            return {};
        };

        return TabPage;
    }
});
