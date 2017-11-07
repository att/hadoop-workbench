define(function (require) {
    "use strict";

    require('../ngModule').service('userSettings.storage', Storage);

    var ng = require("angular");

    Storage.$inject = ["$rootScope", "userSettings.restService", "auth.AUTH_EVENTS", "user-settings.pages.service-users.models.ServiceUser",
        'user-settings.pages.aws-provision-settings-properties.storageKeys'];

    function Storage($rootScope, restService, AUTH_EVENTS, User, awsProvisionStorageKeys) {
        var initialized = false;
        var settings = null;

        $rootScope.$on(AUTH_EVENTS.logoutSuccess, function () {
            initialized = false;
            settings = null;
        });

        this.save = function () {
            var hdfsUserId = null;
            var oozieUserId = null;
            var localUserAsService = false;
            var filtered = {};
            ng.forEach(settings, function (value, name) {
                switch (name) {
                    case "hdfsUserId":
                    {
                        hdfsUserId = value;
                        break;
                    }
                    case "oozieUserId":
                    {
                        oozieUserId = value;
                        break;
                    }
                    case "localUserAsService":
                    {
                        localUserAsService = value;
                        break;
                    }
                    default:
                    {
                        filtered[name] = value;
                    }
                }
            });
            return restService.saveUserSettings(filtered, {
                hdfsUserId: hdfsUserId,
                oozieUserId: oozieUserId,
                localUserAsService: localUserAsService
            });
        };

        this.isInitialized = function () {
            return initialized;
        };

        this.init = function (username) {
            return restService.getUserSettings(username).then(function (data) {
                var settings = data.settings;
                settings.hdfsUserId = data.hdfsUserId;
                settings.oozieUserId = data.oozieUserId;
                settings.localUserAsService = data.localUserAsService;
                init(settings);
                return this;
            }.bind(this));
        };

        this.set = function (name, value) {
            settings[name] = value;
        };

        this.get = function (name) {
            return settings[name];
        };

        function init(_settings) {
            var defaultSettings = {};
            defaultSettings[awsProvisionStorageKeys.AWS_PROVISION] = null;

            settings = ng.extend(defaultSettings, {
                confirmWidgetRemoval: false,
                showPropertiesOnNodeCreate: false,
                showAdvancedConfigProperties: false,
                showSearchFilter: false,
                isSearchFilterStyleInline: true,
                hdfsUserId: null,
                oozieUserId: null,
                localUserAsService: false
            }, _settings);
            initialized = true;
        }
    }
});