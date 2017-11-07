/**
 * @namespace Dashboard.Models
 */

define(function (require) {
    'use strict';

    var ng = require('angular');
    require('../ngModule').factory('dashboard.models.Widget', getWidget);

    getWidget.$inject = [
        'dashboard.widgets.DashboardWidget.TabManager',
        'core.guid'
    ];
    function getWidget(TabManager, guid) {

        /**
         * @typedef {{
         *          wSize: number,
         *          hSize: number,
         *          fullWidth: boolean,
         *          isActive: boolean,
         *          title: string,
         *          secondaryTitle: string,
         *          plugin: (Dashboard.Models.DashboardWidgetPlugin|Dashboard.Models.dashboardWidgetPluginOptions|null),
         *          data: object,
         *          tabs: Array.<(Dashboard.Models.WidgetHeaderTab|Dashboard.Models.widgetHeaderTabOptions)>
         * }} Dashboard.Models.widgetOptions
         */


        /**~
         * Describes Dashboard's widget
         * @param {Dashboard.Models.widgetOptions} options
         * @constructor
         * @name Dashboard.Models.Widget
         */
        function Widget(options) {
            this.wSize = options.wSize;
            this.hSize = options.hSize;
            this.fullWidth = options.fullWidth;
            this.isActive = options.isActive;
            this.minHeight = options.minHeight;
            this.widgetName = options.widgetName;
            this.data = options.data;
            this.params = options.params;
            this.tabs = options.tabs || [];
            this.title = options.title;
            this.secondaryTitle = options.secondaryTitle;
            this.go = ng.noop;
            this.tabManager = options.tabManager;
            this.leftTabManager = options.leftTabManager;
            this.pluginActions = [];
            this.guid = options.guid;
            this.icon = options.icon;
            this.state = options.state;
            this.stateId = options.stateId;
        }

        Widget.prototype.reset = function () {
            this.isActive = false;
            this.title = '';
            this.secondaryTitle = '';
            if (this.tabManager) {
                this.tabManager.clear();
            }
            if (this.leftTabManager) {
                this.leftTabManager.clear();
            }
            this.state = {};
            this.stateId = guid();
        };

        Widget.prototype.addPluginAction = function (action) {
            console.assert(ng.isFunction(action.handler), 'Action handler is missing for the action: ' + action);
            this.pluginActions.push(action);
        };

        /**
         * Returns new instance of model Widget
         * @param  {Dashboard.Models.widgetOptions?} json
         * @return {Dashboard.Models.Widget}    new instance
         */
        Widget.factory = function (json) {
            // flag 'isRestored' points that these fileds should be refresh instead of getting from cache
            json.stateId = json.isRestored ? json.stateId : guid();
            json.state   = json.isRestored ? json.state   : {};

            json = ng.extend({
                wSize: 9,
                hSize: 3,
                fullWidth: true,
                isActive: false,
                minHeight: false,
                minWidth: false,
                title: '',
                secondaryTitle: '',
                widgetName: '',
                data: null,
                params: {},
                tabManager: TabManager.factory(),
                leftTabManager: TabManager.factory(),
                guid: guid(),
                icon: ''
            }, json);
            return new Widget(json);
        };

        Widget.prototype.toJSON = function () {
            return {
                wSize: this.wSize,
                hSize: this.hSize,
                fullWidth: this.fullWidth,
                minHeight: this.minHeight,
                widgetName: this.widgetName,
                data: this.data ? ng.isFunction(this.data.toJSON) ? this.data.toJSON() : this.data : null,
                params: this.params ? ng.isFunction(this.params.toJSON) ? this.params.toJSON() : this.params : {},
                title: this.title,
                secondaryTitle: this.secondaryTitle,
                icon: this.icon,
                state: this.state,
                stateId: this.stateId
            };
        };

        return Widget;
    }
});
