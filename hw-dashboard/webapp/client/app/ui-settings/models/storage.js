define(function (require) {
    "use strict";

    require('../ngModule').service('uiSettings.storage', Storage);

    Storage.$inject = ["uiSettings.restService"];

    function Storage(restService) {
        var initialized = false;
        var settings = null;

        this.isInitialized = function () {
            return initialized;
        };

        this.init = function () {
            initialized = true;
            return restService.getSettings().then(function (data) {
                settings = data;
                return this;
            }.bind(this));
        };

        this.get = function (name, defaultValue = null) {
            if (settings && settings[name]) {
                return settings[name];
            } else {
                return defaultValue;
            }
        };
    }
});