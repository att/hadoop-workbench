/*jshint maxparams: 5*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').service('platform.widgetHelper', WidgetHelperService);

    WidgetHelperService.$inject = [];

    function WidgetHelperService() {

            this.setNewPlatformNameParam = function (dashboardWidget, newPlatformName) {
                dashboardWidget.params.newPlatformName = newPlatformName;
                return dashboardWidget;
            };

            this.setNewPlatformTypeIdParam = function (dashboardWidget, newPlatformTypeId) {
                dashboardWidget.params.newPlatformTypeId = newPlatformTypeId;
                return dashboardWidget;
            };

            this.clearNewPlatformNameParam = function (dashboardWidget) {
                var newParams = ng.extend({} ,dashboardWidget.params);
                delete (newParams.newPlatformName);
                dashboardWidget.params = newParams;
                return dashboardWidget;
            };

            this.clearNewPlatformTypeIdParam = function (dashboardWidget) {
                var newParams = ng.extend({} ,dashboardWidget.params);
                delete (newParams.newPlatformTypeId);
                dashboardWidget.params = newParams;
                return dashboardWidget;
            };

            this.setPlatformParam = function (dashboardWidget, platform) {
                dashboardWidget.params.platform = platform;
            }

    }
});
